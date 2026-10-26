import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  AccountEntity,
  ContactEntity,
  DealEntity,
  ICrmRepository,
  LeadEntity,
} from './crm.repository.js';
import type { LeadStatus } from '@crm/domain';
import type { ProductCatalogItemDto, ProformaInvoiceDto } from '@crm/contracts';

@Injectable()
export class PrismaCrmRepository implements ICrmRepository {
  private products: Map<string, ProductCatalogItemDto> = new Map();
  private invoices: Map<string, ProformaInvoiceDto> = new Map();
  private dealExtensions: Map<string, Partial<DealEntity>> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /* Accounts */

  private mapAccount(a: any): AccountEntity {
    return {
      id: a.id,
      organizationId: a.organizationId,
      ownerId: a.ownerId ?? null,
      name: a.name,
      type: a.type,
      status: a.status,
      website: a.website ?? null,
      phone: a.phone ?? null,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
      updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
    };
  }

  async findAccounts(organizationId: string): Promise<AccountEntity[]> {
    const list = await (this.prisma as any).account.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((a: any) => this.mapAccount(a));
  }

  async findAccountById(organizationId: string, id: string): Promise<AccountEntity | null> {
    const account = await (this.prisma as any).account.findUnique({
      where: { id },
    });
    if (!account || account.organizationId !== organizationId) return null;
    return this.mapAccount(account);
  }

  async createAccount(
    data: Omit<AccountEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AccountEntity> {
    const created = await (this.prisma as any).account.create({
      data: {
        organizationId: data.organizationId,
        ownerId: data.ownerId,
        name: data.name,
        type: data.type,
        status: data.status,
        website: data.website,
        phone: data.phone,
      },
    });
    return this.mapAccount(created);
  }

  async updateAccount(account: AccountEntity): Promise<AccountEntity> {
    const updated = await (this.prisma as any).account.update({
      where: { id: account.id },
      data: {
        name: account.name,
        type: account.type,
        status: account.status,
        website: account.website,
        phone: account.phone,
        ownerId: account.ownerId,
      },
    });
    return this.mapAccount(updated);
  }

  async deleteAccount(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findAccountById(organizationId, id);
    if (!existing) return false;
    await (this.prisma as any).account.delete({
      where: { id },
    });
    return true;
  }

  /* Contacts */

  private mapContact(c: any): ContactEntity {
    return {
      id: c.id,
      organizationId: c.organizationId,
      accountId: c.accountId ?? null,
      ownerId: c.ownerId ?? null,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? null,
      phone: c.phone ?? null,
      birthDate: c.birthDate ? (c.birthDate instanceof Date ? c.birthDate.toISOString() : c.birthDate) : undefined,
      lastInteractionAt: c.lastInteractionAt ? (c.lastInteractionAt instanceof Date ? c.lastInteractionAt.toISOString() : c.lastInteractionAt) : undefined,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
    };
  }

  async findContacts(organizationId: string, accountId?: string): Promise<ContactEntity[]> {
    const where: any = { organizationId };
    if (accountId) where.accountId = accountId;

    const list = await (this.prisma as any).contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return list.map((c: any) => this.mapContact(c));
  }

  async findContactById(organizationId: string, id: string): Promise<ContactEntity | null> {
    const contact = await (this.prisma as any).contact.findUnique({
      where: { id },
    });
    if (!contact || contact.organizationId !== organizationId) return null;
    return this.mapContact(contact);
  }

  async createContact(
    data: Omit<ContactEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ContactEntity> {
    const created = await (this.prisma as any).contact.create({
      data: {
        organizationId: data.organizationId,
        accountId: data.accountId,
        ownerId: data.ownerId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
    });
    return this.mapContact(created);
  }

  async updateContact(contact: ContactEntity): Promise<ContactEntity> {
    const updated = await (this.prisma as any).contact.update({
      where: { id: contact.id },
      data: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        accountId: contact.accountId,
        ownerId: contact.ownerId,
      },
    });
    return this.mapContact(updated);
  }

  async deleteContact(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findContactById(organizationId, id);
    if (!existing) return false;
    await (this.prisma as any).contact.delete({
      where: { id },
    });
    return true;
  }

  /* Leads */

  private mapLead(l: any): LeadEntity {
    return {
      id: l.id,
      organizationId: l.organizationId,
      ownerId: l.ownerId ?? null,
      accountId: l.accountId ?? null,
      convertedContactId: l.convertedContactId ?? null,
      convertedDealId: l.convertedDealId ?? null,
      displayName: l.displayName,
      email: l.email ?? null,
      phone: l.phone ?? null,
      source: l.source ?? null,
      status: l.status as LeadStatus,
      createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
      updatedAt: l.updatedAt instanceof Date ? l.updatedAt.toISOString() : l.updatedAt,
    };
  }

  async findLeads(organizationId: string): Promise<LeadEntity[]> {
    const list = await (this.prisma as any).lead.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((l: any) => this.mapLead(l));
  }

  async findLeadById(organizationId: string, id: string): Promise<LeadEntity | null> {
    const lead = await (this.prisma as any).lead.findUnique({
      where: { id },
    });
    if (!lead || lead.organizationId !== organizationId) return null;
    return this.mapLead(lead);
  }

  async createLead(
    data: Omit<
      LeadEntity,
      'id' | 'createdAt' | 'updatedAt' | 'convertedContactId' | 'convertedDealId'
    >,
  ): Promise<LeadEntity> {
    const created = await (this.prisma as any).lead.create({
      data: {
        organizationId: data.organizationId,
        ownerId: data.ownerId,
        accountId: data.accountId,
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        source: data.source,
        status: data.status,
      },
    });
    return this.mapLead(created);
  }

  async updateLead(lead: LeadEntity): Promise<LeadEntity> {
    const updated = await (this.prisma as any).lead.update({
      where: { id: lead.id },
      data: {
        displayName: lead.displayName,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        accountId: lead.accountId,
        ownerId: lead.ownerId,
      },
    });
    return this.mapLead(updated);
  }

  async deleteLead(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findLeadById(organizationId, id);
    if (!existing) return false;
    await (this.prisma as any).lead.delete({
      where: { id },
    });
    return true;
  }

  /* Deals */

  private mapDeal(d: any): DealEntity {
    const ext = this.dealExtensions.get(d.id) || {};
    return {
      id: d.id,
      organizationId: d.organizationId,
      accountId: d.accountId ?? null,
      ownerId: d.ownerId ?? null,
      name: d.name,
      stage: d.stage,
      amountMinor: d.amountMinor !== null && d.amountMinor !== undefined ? Number(d.amountMinor) : null,
      currency: d.currency ?? null,
      probability: d.probability ?? null,
      targetCloseAt: d.targetCloseAt ? (d.targetCloseAt instanceof Date ? d.targetCloseAt.toISOString() : d.targetCloseAt) : null,
      lossReason: ext.lossReason ?? null,
      lossDescription: ext.lossDescription ?? null,
      lostAt: ext.lostAt ?? null,
      nextActionTitle: ext.nextActionTitle ?? null,
      nextActionDueAt: ext.nextActionDueAt ?? null,
      stageUpdatedAt: ext.stageUpdatedAt ?? null,
      products: ext.products ?? null,
      createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
      updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : d.updatedAt,
    };
  }

  async findDeals(organizationId: string, accountId?: string): Promise<DealEntity[]> {
    const where: any = { organizationId };
    if (accountId) where.accountId = accountId;

    const list = await (this.prisma as any).deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return list.map((d: any) => this.mapDeal(d));
  }

  async findDealById(organizationId: string, id: string): Promise<DealEntity | null> {
    const deal = await (this.prisma as any).deal.findUnique({
      where: { id },
    });
    if (!deal || deal.organizationId !== organizationId) return null;
    return this.mapDeal(deal);
  }

  async createDeal(
    data: Omit<DealEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DealEntity> {
    const created = await (this.prisma as any).deal.create({
      data: {
        organizationId: data.organizationId,
        accountId: data.accountId,
        ownerId: data.ownerId,
        name: data.name,
        stage: data.stage,
        amountMinor: data.amountMinor !== null && data.amountMinor !== undefined ? BigInt(data.amountMinor) : null,
        currency: data.currency,
        probability: data.probability,
        targetCloseAt: data.targetCloseAt ? new Date(data.targetCloseAt) : null,
      },
    });
    if (data.lossReason || data.nextActionTitle || data.products || data.stageUpdatedAt) {
      this.dealExtensions.set(created.id, {
        lossReason: data.lossReason,
        lossDescription: data.lossDescription,
        lostAt: data.lostAt,
        nextActionTitle: data.nextActionTitle,
        nextActionDueAt: data.nextActionDueAt,
        stageUpdatedAt: data.stageUpdatedAt,
        products: data.products,
      });
    }
    return this.mapDeal(created);
  }

  async updateDeal(deal: DealEntity): Promise<DealEntity> {
    const updated = await (this.prisma as any).deal.update({
      where: { id: deal.id },
      data: {
        name: deal.name,
        stage: deal.stage,
        amountMinor: deal.amountMinor !== null && deal.amountMinor !== undefined ? BigInt(deal.amountMinor) : null,
        currency: deal.currency,
        probability: deal.probability,
        targetCloseAt: deal.targetCloseAt ? new Date(deal.targetCloseAt) : null,
        accountId: deal.accountId,
        ownerId: deal.ownerId,
      },
    });
    this.dealExtensions.set(deal.id, {
      lossReason: deal.lossReason,
      lossDescription: deal.lossDescription,
      lostAt: deal.lostAt,
      nextActionTitle: deal.nextActionTitle,
      nextActionDueAt: deal.nextActionDueAt,
      stageUpdatedAt: deal.stageUpdatedAt,
      products: deal.products,
    });
    return this.mapDeal(updated);
  }

  async deleteDeal(organizationId: string, id: string): Promise<boolean> {
    const existing = await this.findDealById(organizationId, id);
    if (!existing) return false;
    await (this.prisma as any).deal.delete({
      where: { id },
    });
    this.dealExtensions.delete(id);
    return true;
  }

  /* Products */
  async findProducts(organizationId: string): Promise<ProductCatalogItemDto[]> {
    return Array.from(this.products.values()).filter((p) => p.organizationId === organizationId);
  }

  async createProduct(
    organizationId: string,
    data: Omit<ProductCatalogItemDto, 'id' | 'organizationId'>,
  ): Promise<ProductCatalogItemDto> {
    const id = randomUUID();
    const entity: ProductCatalogItemDto = {
      ...data,
      id,
      organizationId,
    };
    this.products.set(id, entity);
    return entity;
  }

  /* Invoices */
  async findInvoices(organizationId: string, dealId?: string): Promise<ProformaInvoiceDto[]> {
    return Array.from(this.invoices.values()).filter(
      (inv) => inv.organizationId === organizationId && (!dealId || inv.dealId === dealId),
    );
  }

  async createInvoice(
    organizationId: string,
    data: Omit<ProformaInvoiceDto, 'id' | 'organizationId' | 'createdAt'>,
  ): Promise<ProformaInvoiceDto> {
    const id = randomUUID();
    const entity: ProformaInvoiceDto = {
      ...data,
      id,
      organizationId,
      createdAt: new Date().toISOString(),
    };
    this.invoices.set(id, entity);
    return entity;
  }
}
