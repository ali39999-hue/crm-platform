import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  canConvertLead,
  isDuplicateCandidate,
  normalizeEmail,
  normalizePhone,
} from '@crm/domain';
import {
  AccountEntity,
  ContactEntity,
  DealEntity,
  InMemoryCrmRepository,
  LeadEntity,
} from './crm.repository.js';
import type { CreateAccountDto } from './dto/create-account.dto.js';
import type { CreateContactDto } from './dto/create-contact.dto.js';
import type { CreateLeadDto } from './dto/create-lead.dto.js';
import type { ConvertLeadDto } from './dto/convert-lead.dto.js';
import type { CreateDealDto } from './dto/create-deal.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import type {
  AccountDto,
  ContactDto,
  ConvertLeadResponse,
  CustomerTimelineItem,
  DealDto,
  LeadDto,
} from '@crm/contracts';

@Injectable()
export class CrmService {
  constructor(
    private readonly crmRepo: InMemoryCrmRepository,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  /* Accounts */
  async getAccounts(organizationId: string): Promise<AccountDto[]> {
    const list = await this.crmRepo.findAccounts(organizationId);
    return list.map((a) => this.mapAccount(a));
  }

  async getAccountById(organizationId: string, id: string): Promise<AccountDto> {
    const account = await this.crmRepo.findAccountById(organizationId, id);
    if (!account) {
      throw new NotFoundException(`Account ${id} not found in this organization`);
    }
    return this.mapAccount(account);
  }

  async createAccount(
    organizationId: string,
    actorId: string,
    dto: CreateAccountDto,
    requestId?: string,
  ): Promise<AccountDto> {
    const account = await this.crmRepo.createAccount({
      organizationId,
      ownerId: dto.ownerId ?? actorId,
      name: dto.name.trim(),
      type: dto.type ?? 'COMPANY',
      status: 'ACTIVE',
      website: dto.website?.trim() ?? null,
      phone: dto.phone ? normalizePhone(dto.phone) : null,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_ACCOUNT_CREATED',
      entityType: 'Account',
      entityId: account.id,
      requestId,
      metadata: { name: account.name, type: account.type },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmAccountCreated',
      aggregateType: 'Account',
      aggregateId: account.id,
      payload: { name: account.name },
    });

    return this.mapAccount(account);
  }

  /* Contacts */
  async getContacts(organizationId: string, accountId?: string): Promise<ContactDto[]> {
    const list = await this.crmRepo.findContacts(organizationId, accountId);
    return list.map((c) => this.mapContact(c));
  }

  async createContact(
    organizationId: string,
    actorId: string,
    dto: CreateContactDto,
    requestId?: string,
  ): Promise<ContactDto> {
    if (dto.accountId) {
      const account = await this.crmRepo.findAccountById(organizationId, dto.accountId);
      if (!account) {
        throw new NotFoundException(`Account ${dto.accountId} not found in organization`);
      }
    }

    const contact = await this.crmRepo.createContact({
      organizationId,
      accountId: dto.accountId ?? null,
      ownerId: dto.ownerId ?? actorId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email ? normalizeEmail(dto.email) : null,
      phone: dto.phone ? normalizePhone(dto.phone) : null,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_CONTACT_CREATED',
      entityType: 'Contact',
      entityId: contact.id,
      requestId,
      metadata: { name: `${contact.firstName} ${contact.lastName}`, email: contact.email },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmContactCreated',
      aggregateType: 'Contact',
      aggregateId: contact.id,
      payload: { name: `${contact.firstName} ${contact.lastName}` },
    });

    return this.mapContact(contact);
  }

  /* Leads */
  async getLeads(organizationId: string): Promise<LeadDto[]> {
    const list = await this.crmRepo.findLeads(organizationId);
    return list.map((l) => this.mapLead(l));
  }

  async createLead(
    organizationId: string,
    actorId: string,
    dto: CreateLeadDto,
    requestId?: string,
  ): Promise<{ lead: LeadDto; isDuplicateCandidate: boolean; duplicateCandidateId?: string | undefined }> {
    const normEmail = dto.email ? normalizeEmail(dto.email) : null;
    const normPhone = dto.phone ? normalizePhone(dto.phone) : null;

    // Deduplication evaluation against existing leads in the organization
    const existingLeads = await this.crmRepo.findLeads(organizationId);
    let matchedCandidate: LeadEntity | undefined;

    for (const ex of existingLeads) {
      if (
        isDuplicateCandidate(
          { email: ex.email, phone: ex.phone },
          { email: normEmail, phone: normPhone },
        )
      ) {
        matchedCandidate = ex;
        break;
      }
    }

    const lead = await this.crmRepo.createLead({
      organizationId,
      ownerId: dto.ownerId ?? actorId,
      accountId: null,
      displayName: dto.displayName.trim(),
      email: normEmail,
      phone: normPhone,
      source: dto.source ?? 'MANUAL',
      status: 'NEW',
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      requestId,
      metadata: {
        displayName: lead.displayName,
        email: lead.email,
        isDuplicate: Boolean(matchedCandidate),
        duplicateCandidateId: matchedCandidate?.id,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmLeadCreated',
      aggregateType: 'Lead',
      aggregateId: lead.id,
      payload: { displayName: lead.displayName },
    });

    return {
      lead: this.mapLead(lead),
      isDuplicateCandidate: Boolean(matchedCandidate),
      duplicateCandidateId: matchedCandidate?.id,
    };
  }

  /* Idempotent Atomic Lead Conversion */
  async convertLead(
    organizationId: string,
    actorId: string,
    leadId: string,
    dto: ConvertLeadDto,
    requestId?: string,
  ): Promise<ConvertLeadResponse> {
    const lead = await this.crmRepo.findLeadById(organizationId, leadId);
    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found in this organization`);
    }

    // Idempotency: If lead is already converted, return existing converted mapping
    if (lead.status === 'CONVERTED') {
      return {
        leadId: lead.id,
        accountId: lead.accountId ?? '',
        contactId: lead.convertedContactId ?? '',
        dealId: lead.convertedDealId,
      };
    }

    if (!canConvertLead(lead.status)) {
      throw new BadRequestException(
        `Lead in status ${lead.status} cannot be converted`,
      );
    }

    // 1. Create or resolve Account
    const accountName = dto.accountName?.trim() || lead.displayName;
    const account = await this.crmRepo.createAccount({
      organizationId,
      ownerId: lead.ownerId ?? actorId,
      name: accountName,
      type: 'COMPANY',
      status: 'ACTIVE',
      website: null,
      phone: lead.phone,
    });

    // 2. Create Contact from Lead
    const nameParts = lead.displayName.split(' ');
    const firstName = nameParts[0] || lead.displayName;
    const lastName = nameParts.slice(1).join(' ') || 'مشتری';

    const contact = await this.crmRepo.createContact({
      organizationId,
      accountId: account.id,
      ownerId: lead.ownerId ?? actorId,
      firstName,
      lastName,
      email: lead.email,
      phone: lead.phone,
    });

    // 3. Create Deal if deal name or amount is provided
    let deal: DealEntity | undefined;
    if (dto.dealName || (dto.dealAmountMinor !== undefined && dto.dealAmountMinor > 0)) {
      deal = await this.crmRepo.createDeal({
        organizationId,
        accountId: account.id,
        ownerId: lead.ownerId ?? actorId,
        name: dto.dealName?.trim() || `فرصت فروش - ${account.name}`,
        stage: 'QUALIFICATION',
        amountMinor: dto.dealAmountMinor ?? 0,
        currency: dto.dealCurrency || 'IRR',
        probability: 20,
        targetCloseAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      });
    }

    // 4. Update Lead to CONVERTED
    lead.status = 'CONVERTED';
    lead.accountId = account.id;
    lead.convertedContactId = contact.id;
    lead.convertedDealId = deal?.id ?? null;
    await this.crmRepo.updateLead(lead);

    // 5. Audit & Outbox
    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_LEAD_CONVERTED',
      entityType: 'Lead',
      entityId: lead.id,
      requestId,
      metadata: {
        idempotencyKey: dto.idempotencyKey,
        accountId: account.id,
        contactId: contact.id,
        dealId: deal?.id,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmLeadConverted',
      aggregateType: 'Lead',
      aggregateId: lead.id,
      payload: {
        accountId: account.id,
        contactId: contact.id,
        dealId: deal?.id,
      },
    });

    return {
      leadId: lead.id,
      accountId: account.id,
      contactId: contact.id,
      dealId: deal?.id ?? null,
    };
  }

  /* Deals */
  async getDeals(organizationId: string, accountId?: string): Promise<DealDto[]> {
    const list = await this.crmRepo.findDeals(organizationId, accountId);
    return list.map((d) => this.mapDeal(d));
  }

  async createDeal(
    organizationId: string,
    actorId: string,
    dto: CreateDealDto,
    requestId?: string,
  ): Promise<DealDto> {
    if (dto.accountId) {
      const account = await this.crmRepo.findAccountById(organizationId, dto.accountId);
      if (!account) {
        throw new NotFoundException(`Account ${dto.accountId} not found in organization`);
      }
    }

    const deal = await this.crmRepo.createDeal({
      organizationId,
      accountId: dto.accountId ?? null,
      ownerId: dto.ownerId ?? actorId,
      name: dto.name.trim(),
      stage: dto.stage ?? 'QUALIFICATION',
      amountMinor: dto.amountMinor ?? 0,
      currency: dto.currency || 'IRR',
      probability: dto.probability ?? 10,
      targetCloseAt: dto.targetCloseAt ?? null,
    });

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_DEAL_CREATED',
      entityType: 'Deal',
      entityId: deal.id,
      requestId,
      metadata: { name: deal.name, amountMinor: deal.amountMinor, currency: deal.currency },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'CrmDealCreated',
      aggregateType: 'Deal',
      aggregateId: deal.id,
      payload: { name: deal.name },
    });

    return this.mapDeal(deal);
  }

  /* Customer 360 Timeline */
  async getCustomerTimeline(organizationId: string, accountId: string): Promise<CustomerTimelineItem[]> {
    const account = await this.crmRepo.findAccountById(organizationId, accountId);
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found in this organization`);
    }

    const timeline: CustomerTimelineItem[] = [];

    // Account creation event
    timeline.push({
      id: `acc-${account.id}`,
      entityType: 'ACCOUNT',
      entityId: account.id,
      kind: 'ACCOUNT_CREATED',
      summary: `حساب مشتری «${account.name}» ایجاد شد`,
      occurredAt: account.createdAt,
    });

    // Associated Contacts
    const contacts = await this.crmRepo.findContacts(organizationId, accountId);
    for (const c of contacts) {
      timeline.push({
        id: `con-${c.id}`,
        entityType: 'CONTACT',
        entityId: c.id,
        kind: 'CONTACT_ADDED',
        summary: `مخاطب «${c.firstName} ${c.lastName}» به حساب اضافه شد`,
        occurredAt: c.createdAt,
      });
    }

    // Associated Deals
    const deals = await this.crmRepo.findDeals(organizationId, accountId);
    for (const d of deals) {
      timeline.push({
        id: `deal-${d.id}`,
        entityType: 'DEAL',
        entityId: d.id,
        kind: 'DEAL_CREATED',
        summary: `فرصت فروش «${d.name}» (${d.stage}) ثبت شد`,
        occurredAt: d.createdAt,
        metadata: { amountMinor: d.amountMinor, currency: d.currency },
      });
    }

    return timeline.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }

  private mapAccount(a: AccountEntity): AccountDto {
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      status: a.status,
      website: a.website,
      phone: a.phone,
      ownerId: a.ownerId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  private mapContact(c: ContactEntity): ContactDto {
    return {
      id: c.id,
      accountId: c.accountId,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      ownerId: c.ownerId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  private mapLead(l: LeadEntity): LeadDto {
    return {
      id: l.id,
      displayName: l.displayName,
      email: l.email,
      phone: l.phone,
      source: l.source,
      status: l.status,
      ownerId: l.ownerId,
      accountId: l.accountId,
      convertedContactId: l.convertedContactId,
      convertedDealId: l.convertedDealId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    };
  }

  private mapDeal(d: DealEntity): DealDto {
    return {
      id: d.id,
      accountId: d.accountId,
      name: d.name,
      stage: d.stage,
      amountMinor: d.amountMinor,
      currency: d.currency,
      probability: d.probability,
      targetCloseAt: d.targetCloseAt,
      ownerId: d.ownerId,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}
