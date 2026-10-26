import { describe, expect, it, beforeEach } from 'vitest';
import { VoipService } from './voip.service.js';
import { InMemoryCrmRepository } from '../../crm/crm.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { OutboxService } from '../../outbox/outbox.service.js';

describe('VoIP Telephony & Caller-ID Popup Integration (Didar PBX Benchmark)', () => {
  let voipService: VoipService;
  let crmRepo: InMemoryCrmRepository;
  let auditService: AuditService;
  let outboxService: OutboxService;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    crmRepo = new InMemoryCrmRepository();
    auditService = new AuditService();
    outboxService = new OutboxService();
    voipService = new VoipService(crmRepo, auditService, outboxService);
  });

  it('matches incoming phone number to existing contact and company dossier', async () => {
    // Seeded contact in orgAlpha has phone: 09121234567, name: محمد رضایی, account: فولاد گستر آریا
    const profile = await voipService.handleCallEvent(orgAlphaId, {
      callId: 'call-101',
      callerNumber: '+98 (912) 123-4567', // formatted phone
      calleeNumber: '102',
      direction: 'INBOUND',
      status: 'RINGING',
      timestamp: new Date().toISOString(),
    });

    expect(profile.callId).toBe('call-101');
    expect(profile.isExistingCustomer).toBe(true);
    expect(profile.matchedContact?.name).toContain('محمد رضایی');
    expect(profile.matchedAccount?.name).toContain('فولاد گستر');
    expect(profile.recentDeals).toBeDefined();
    expect(profile.recentDeals?.length).toBeGreaterThan(0);

    // Verify audit event
    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'VOIP_CALL_EVENT_RECEIVED');
    expect(audit).toBeDefined();
    expect(audit?.metadata?.isExistingCustomer).toBe(true);
  });

  it('handles unknown caller gracefully and allows identifying non-existing customer', async () => {
    const profile = await voipService.handleCallEvent(orgAlphaId, {
      callId: 'call-unknown-1',
      callerNumber: '09359998877',
      calleeNumber: '101',
      direction: 'INBOUND',
      status: 'RINGING',
      timestamp: new Date().toISOString(),
    });

    expect(profile.isExistingCustomer).toBe(false);
    expect(profile.matchedContact).toBeNull();
    expect(profile.matchedAccount).toBeNull();
  });

  it('manages active ringing call state and cleans up on call ended', async () => {
    // 1. Inbound call rings
    await voipService.handleCallEvent(orgAlphaId, {
      callId: 'call-lifecycle-1',
      callerNumber: '09121234567',
      calleeNumber: '105',
      direction: 'INBOUND',
      status: 'RINGING',
      timestamp: new Date().toISOString(),
    });

    const activeCall = await voipService.getActiveCall(orgAlphaId, '105');
    expect(activeCall).toBeDefined();
    expect(activeCall?.callId).toBe('call-lifecycle-1');

    // 2. Call ends
    await voipService.handleCallEvent(orgAlphaId, {
      callId: 'call-lifecycle-1',
      callerNumber: '09121234567',
      calleeNumber: '105',
      direction: 'INBOUND',
      status: 'ENDED',
      durationSeconds: 120,
      timestamp: new Date().toISOString(),
    });

    const clearedCall = await voipService.getActiveCall(orgAlphaId, '105');
    expect(clearedCall).toBeNull();
  });

  it('initiates click-to-call outbound action with audit log', async () => {
    const result = await voipService.initiateClickToCall(orgAlphaId, employeeAlphaId, {
      phoneNumber: '09121234567',
      extension: '102',
    });

    expect(result.success).toBe(true);
    expect(result.callId).toBeDefined();
    expect(result.message).toContain('برقرار شد');

    const audit = auditService
      .getEvents(orgAlphaId)
      .find((a) => a.action === 'VOIP_CLICK_TO_CALL_INITIATED');
    expect(audit).toBeDefined();
  });

  it('enforces multi-tenant isolation for active calls', async () => {
    await voipService.handleCallEvent(orgAlphaId, {
      callId: 'call-org-alpha',
      callerNumber: '09121234567',
      calleeNumber: '102',
      direction: 'INBOUND',
      status: 'RINGING',
      timestamp: new Date().toISOString(),
    });

    // Org Beta should not see Org Alpha's active call
    const betaCall = await voipService.getActiveCall(orgBetaId);
    expect(betaCall).toBeNull();
  });
});
