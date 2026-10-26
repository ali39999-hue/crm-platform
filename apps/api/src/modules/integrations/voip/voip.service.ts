import { Inject, Injectable } from '@nestjs/common';
import { normalizePhone } from '@crm/domain';
import type {
  ClickToCallRequest,
  VoipCallEventDto,
  VoipCallerProfileDto,
} from '@crm/contracts';
import { ICrmRepository } from '../../crm/crm.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

@Injectable()
export class VoipService {
  // In-memory active calls map: organizationId -> Map<callId, VoipCallerProfileDto>
  private activeCalls: Map<string, Map<string, VoipCallerProfileDto & { status: string; calleeNumber: string }>> =
    new Map();

  constructor(
    @Inject('CRM_REPOSITORY') private readonly crmRepo: ICrmRepository,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async handleCallEvent(
    organizationId: string,
    event: VoipCallEventDto,
  ): Promise<VoipCallerProfileDto> {
    const normCaller = normalizePhone(event.callerNumber) || event.callerNumber;

    // 1. Look up contact with matching phone in organization
    const contacts = await this.crmRepo.findContacts(organizationId);
    const matchedContact = contacts.find((c) => {
      const norm = normalizePhone(c.phone);
      return norm && (norm === normCaller || norm.endsWith(normCaller.slice(-10)));
    });

    // 2. Look up account if contact found or by account phone
    let matchedAccount: { id: string; name: string } | null = null;
    if (matchedContact?.accountId) {
      const acc = await this.crmRepo.findAccountById(organizationId, matchedContact.accountId);
      if (acc) {
        matchedAccount = { id: acc.id, name: acc.name };
      }
    } else {
      const accounts = await this.crmRepo.findAccounts(organizationId);
      const acc = accounts.find((a) => {
        const norm = normalizePhone(a.phone);
        return norm && (norm === normCaller || norm.endsWith(normCaller.slice(-10)));
      });
      if (acc) {
        matchedAccount = { id: acc.id, name: acc.name };
      }
    }

    // 3. Look up recent deals for this customer/account
    const allDeals = await this.crmRepo.findDeals(
      organizationId,
      matchedAccount?.id || undefined,
    );
    const recentDeals = allDeals.slice(0, 3).map((d) => ({
      id: d.id,
      name: d.name,
      amountMinor: d.amountMinor || 0,
      stage: d.stage,
    }));

    const isExistingCustomer = !!(matchedContact || matchedAccount);

    const profile: VoipCallerProfileDto = {
      callId: event.callId,
      callerNumber: event.callerNumber,
      matchedContact: matchedContact
        ? {
            id: matchedContact.id,
            name: `${matchedContact.firstName} ${matchedContact.lastName}`.trim(),
            email: matchedContact.email || undefined,
          }
        : null,
      matchedAccount,
      recentDeals: recentDeals.length > 0 ? recentDeals : undefined,
      isExistingCustomer,
    };

    // Maintain active call state
    if (!this.activeCalls.has(organizationId)) {
      this.activeCalls.set(organizationId, new Map());
    }
    const orgCalls = this.activeCalls.get(organizationId)!;

    if (event.status === 'RINGING' || event.status === 'ANSWERED') {
      orgCalls.set(event.callId, {
        ...profile,
        status: event.status,
        calleeNumber: event.calleeNumber,
      });
    } else if (event.status === 'ENDED' || event.status === 'MISSED') {
      orgCalls.delete(event.callId);
    }

    // Record audit event
    this.auditService.record({
      organizationId,
      actorId: 'voip-pbx-gateway',
      action: 'VOIP_CALL_EVENT_RECEIVED',
      entityType: 'Call',
      entityId: event.callId,
      metadata: {
        callerNumber: event.callerNumber,
        calleeNumber: event.calleeNumber,
        direction: event.direction,
        status: event.status,
        isExistingCustomer,
        matchedContactId: matchedContact?.id,
      },
    });

    this.outboxService.emit({
      organizationId,
      eventType: 'VoipCallEvent',
      aggregateType: 'Call',
      aggregateId: event.callId,
      payload: {
        callerNumber: event.callerNumber,
        calleeNumber: event.calleeNumber,
        status: event.status,
        matchedContact: profile.matchedContact,
        matchedAccount: profile.matchedAccount,
      },
    });

    return profile;
  }

  async getActiveCall(
    organizationId: string,
    extension?: string,
  ): Promise<VoipCallerProfileDto | null> {
    const orgCalls = this.activeCalls.get(organizationId);
    if (!orgCalls || orgCalls.size === 0) return null;

    if (extension) {
      for (const call of orgCalls.values()) {
        if (call.calleeNumber === extension) {
          return call;
        }
      }
    }

    // Return the latest active call
    const calls = Array.from(orgCalls.values());
    return calls[calls.length - 1] || null;
  }

  async initiateClickToCall(
    organizationId: string,
    actorId: string,
    dto: ClickToCallRequest,
  ): Promise<{ success: boolean; message: string; callId: string }> {
    const callId = `call-out-${Date.now()}`;

    this.auditService.record({
      organizationId,
      actorId,
      action: 'VOIP_CLICK_TO_CALL_INITIATED',
      entityType: 'Call',
      entityId: callId,
      metadata: {
        targetPhoneNumber: dto.phoneNumber,
        internalExtension: dto.extension,
        contactId: dto.contactId,
      },
    });

    return {
      success: true,
      message: `تماس با شماره ${dto.phoneNumber} از طریق داخلی ${dto.extension} برقرار شد`,
      callId,
    };
  }
}
