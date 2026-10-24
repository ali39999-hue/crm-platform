import { describe, expect, it, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  NotificationDispatcherService,
  isWithinQuietHours,
} from './notification-dispatcher.service.js';
import { InMemoryNotificationRepository } from './notification.repository.js';
import { InMemoryNotificationDlqRepository } from './notification-dlq.repository.js';
import { EmailAdapter } from './adapters/email.adapter.js';
import { PushAdapter } from './adapters/push.adapter.js';
import {
  SmsAdapter,
  isValidIranianMobile,
  normalizeIranianMobile,
} from './adapters/sms.adapter.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';
import { OutboxService } from '../outbox/outbox.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { UserContext } from '../../common/auth/auth.types.js';

describe('Multi-Channel Notification Dispatcher & Adapters (F6-05)', () => {
  let notificationRepo: InMemoryNotificationRepository;
  let dlqRepo: InMemoryNotificationDlqRepository;
  let auditService: AuditService;
  let emailAdapter: EmailAdapter;
  let pushAdapter: PushAdapter;
  let smsAdapter: SmsAdapter;
  let dispatcherService: NotificationDispatcherService;
  let notificationService: NotificationService;
  let notificationController: NotificationController;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const adminAlphaId = '11111111-1111-1111-1111-111111111111';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';
  const employeeBetaId = '33333333-3333-3333-3333-333333333333';

  const adminAlphaContext: UserContext = {
    id: adminAlphaId,
    email: 'admin@org-alpha.com',
    displayName: 'مدیر آلفا',
    activeOrganization: {
      id: orgAlpha,
      name: 'شرکت آلفا',
      slug: 'alpha',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'شرکت آلفا',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  const employeeAlphaContext: UserContext = {
    id: employeeAlphaId,
    email: 'employee@org-alpha.com',
    displayName: 'کارمند آلفا',
    activeOrganization: {
      id: orgAlpha,
      name: 'شرکت آلفا',
      slug: 'alpha',
      role: 'Employee',
    },
    memberships: [
      {
        organizationId: orgAlpha,
        organizationName: 'شرکت آلفا',
        role: 'Employee',
        active: true,
      },
    ],
  };

  const adminBetaContext: UserContext = {
    id: employeeBetaId,
    email: 'admin@org-beta.com',
    displayName: 'مدیر بتا',
    activeOrganization: {
      id: orgBeta,
      name: 'شرکت بتا',
      slug: 'beta',
      role: 'OrganizationAdmin',
    },
    memberships: [
      {
        organizationId: orgBeta,
        organizationName: 'شرکت بتا',
        role: 'OrganizationAdmin',
        active: true,
      },
    ],
  };

  beforeEach(() => {
    notificationRepo = new InMemoryNotificationRepository();
    dlqRepo = new InMemoryNotificationDlqRepository();
    auditService = new AuditService();
    emailAdapter = new EmailAdapter(auditService);
    pushAdapter = new PushAdapter();
    smsAdapter = new SmsAdapter();

    dispatcherService = new NotificationDispatcherService(
      notificationRepo,
      dlqRepo,
      emailAdapter,
      pushAdapter,
      smsAdapter,
    );
    dispatcherService.setMaxRetries(3);
    dispatcherService.setRetryDelayMs(0);

    const outboxService = new OutboxService();
    notificationService = new NotificationService(notificationRepo, outboxService, dispatcherService);
    notificationController = new NotificationController(notificationService, dispatcherService);
  });

  describe('1. Channel Delivery Adapters', () => {
    describe('EmailAdapter', () => {
      it('delivers email successfully via SMTP mock with audit log', async () => {
        emailAdapter.setProvider('smtp');
        const res = await emailAdapter.send(
          'user@example.com',
          'خوش‌آمدگویی',
          'متن تست ایمیل',
          { organizationId: orgAlpha, actorId: adminAlphaId },
        );

        expect(res.success).toBe(true);
        expect(res.messageId).toMatch(/^email_smtp_/);

        const auditLogs = auditService.getEvents(orgAlpha);
        const sentLog = auditLogs.find((l) => l.action === 'NOTIFICATION_EMAIL_SENT');
        expect(sentLog).toBeDefined();
        expect(sentLog?.metadata?.to).toBe('user@example.com');
      });

      it('delivers email successfully via Resend mock', async () => {
        emailAdapter.setProvider('resend_mock');
        const res = await emailAdapter.send('support@example.com', 'گزارش هفتگی', 'محتوا');
        expect(res.success).toBe(true);
        expect(res.messageId).toMatch(/^email_resend_mock_/);
      });

      it('validates email format and rejects invalid addresses', async () => {
        const res = await emailAdapter.send('invalid-email', 'موضوع', 'متن');
        expect(res.success).toBe(false);
        expect(res.error).toContain('Invalid email address');
      });

      it('handles simulated delivery failure and audits failure', async () => {
        emailAdapter.setSimulateFailure(true, 'SMTP timeout 504');
        const res = await emailAdapter.send('user@example.com', 'موضوع', 'متن', {
          organizationId: orgAlpha,
        });

        expect(res.success).toBe(false);
        expect(res.error).toBe('SMTP timeout 504');

        const auditLogs = auditService.getEvents(orgAlpha);
        const failLog = auditLogs.find((l) => l.action === 'NOTIFICATION_EMAIL_FAILED');
        expect(failLog).toBeDefined();
      });
    });

    describe('PushAdapter', () => {
      it('delivers push notification successfully via WebPush', async () => {
        pushAdapter.setProvider('webpush');
        const res = await pushAdapter.send(
          'https://fcm.googleapis.com/fcm/send/sample_subscription_token_123',
          'اعلان جدید',
          'وظیفه جدید ایجاد شد',
        );

        expect(res.success).toBe(true);
        expect(res.messageId).toMatch(/^push_webpush_/);
      });

      it('delivers push notification successfully via FCM', async () => {
        pushAdapter.setProvider('fcm');
        const res = await pushAdapter.send(
          'fcm_device_token_xyz_987654321',
          'اعلان اضطراری',
          'سرور با خطا مواجه شد',
        );

        expect(res.success).toBe(true);
        expect(res.messageId).toMatch(/^push_fcm_/);
      });

      it('rejects empty or invalid push target tokens', async () => {
        const res = await pushAdapter.send('short', 'تست', 'متن');
        expect(res.success).toBe(false);
        expect(res.error).toContain('Invalid push target token');
      });

      it('handles simulated push gateway failure', async () => {
        pushAdapter.setSimulateFailure(true, 'FCM registration token expired');
        const res = await pushAdapter.send('fcm_token_valid_12345678', 'تست', 'متن');
        expect(res.success).toBe(false);
        expect(res.error).toBe('FCM registration token expired');
      });
    });

    describe('SmsAdapter & Iranian Mobile Validation', () => {
      it('validates Iranian mobile formats accurately', () => {
        // Valid Iranian phone formats
        expect(isValidIranianMobile('09123456789')).toBe(true);
        expect(isValidIranianMobile('+989123456789')).toBe(true);
        expect(isValidIranianMobile('00989123456789')).toBe(true);
        expect(isValidIranianMobile('9123456789')).toBe(true);
        expect(isValidIranianMobile('09351234567')).toBe(true);
        expect(isValidIranianMobile('09901234567')).toBe(true);
        expect(isValidIranianMobile('0912-345-6789')).toBe(true);
        expect(isValidIranianMobile('+98 912 345 6789')).toBe(true);

        // Invalid phone formats
        expect(isValidIranianMobile('02112345678')).toBe(false); // Tehran landline
        expect(isValidIranianMobile('12345')).toBe(false); // too short
        expect(isValidIranianMobile('+12025550123')).toBe(false); // US phone
        expect(isValidIranianMobile('not-a-number')).toBe(false);
      });

      it('normalizes Iranian phone numbers to canonical E.164 (+989xxxxxxxxx)', () => {
        expect(normalizeIranianMobile('09123456789')).toBe('+989123456789');
        expect(normalizeIranianMobile('00989123456789')).toBe('+989123456789');
        expect(normalizeIranianMobile('+989123456789')).toBe('+989123456789');
        expect(normalizeIranianMobile('9123456789')).toBe('+989123456789');
      });

      it('delivers SMS via Kavenegar mock with valid Iranian phone number', async () => {
        smsAdapter.setProvider('kavenegar');
        const res = await smsAdapter.send(
          '09123456789',
          'کد تأیید',
          'کد ورود شما: ۱۲۳۴۵۶',
        );

        expect(res.success).toBe(true);
        expect(res.messageId).toMatch(/^sms_kavenegar_/);
      });

      it('rejects foreign or malformed number when provider is Kavenegar', async () => {
        smsAdapter.setProvider('kavenegar');
        const res = await smsAdapter.send('+12025550123', 'تست', 'پیامک');
        expect(res.success).toBe(false);
        expect(res.error).toContain('Invalid Iranian mobile number format');
      });

      it('delivers international SMS via Twilio mock', async () => {
        smsAdapter.setProvider('twilio');
        const res = await smsAdapter.send(
          '+12025550123',
          'Security Alert',
          'Your verification code is 654321',
        );
        expect(res.success).toBe(true);
        expect(res.messageId).toMatch(/^sms_twilio_/);
      });

      it('handles simulated SMS failure', async () => {
        smsAdapter.setSimulateFailure(true, 'Kavenegar line suspended');
        const res = await smsAdapter.send('09123456789', 'تست', 'پیامک');
        expect(res.success).toBe(false);
        expect(res.error).toBe('Kavenegar line suspended');
      });
    });
  });

  describe('2. User Preferences Evaluation & Multi-Channel Dispatch', () => {
    it('dispatches to default channels (inApp and email enabled, push disabled)', async () => {
      // Default preferences: { inApp: true, email: true, push: false, digest: true }
      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'TASK_ASSIGNED',
        title: 'تخصیص تسک',
        message: 'تسک جدید برای شما ثبت شد',
        recipient: { email: 'employee@org-alpha.com' },
      });

      expect(res.channels.inApp?.delivered).toBe(true);
      expect(res.channels.email?.delivered).toBe(true);
      expect(res.channels.push?.attempted).toBe(false);
      expect(res.channels.push?.suppressedReason).toContain('Push channel not enabled');
      expect(res.channels.sms?.attempted).toBe(false);
    });

    it('respects updated user preferences with push and sms enabled, email disabled', async () => {
      await notificationRepo.setPreferences(employeeAlphaId, {
        inApp: true,
        email: false,
        push: true,
        digest: false,
        sms: true,
      });

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'TASK_ASSIGNED',
        title: 'تخصیص تسک',
        message: 'تسک جدید',
        recipient: {
          pushToken: 'push_token_sample_12345678',
          phone: '09123456789',
        },
      });

      expect(res.channels.inApp?.delivered).toBe(true);
      expect(res.channels.email?.attempted).toBe(false);
      expect(res.channels.email?.suppressedReason).toContain('Email channel not enabled');
      expect(res.channels.push?.delivered).toBe(true);
      expect(res.channels.sms?.delivered).toBe(true);
    });

    it('suppresses in-app when user disables inApp preference', async () => {
      await notificationRepo.setPreferences(employeeAlphaId, {
        inApp: false,
        email: true,
        push: false,
        digest: false,
      });

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'SYSTEM_NOTIFICATION',
        title: 'اعلان',
        message: 'پیام سیستم',
        recipient: { email: 'emp@test.com' },
      });

      expect(res.channels.inApp?.delivered).toBe(false);
      expect(res.channels.inApp?.suppressedReason).toContain('User opted out of in-app');
      expect(res.channels.email?.delivered).toBe(true);
    });

    it('defers non-urgent email when digest is enabled and notification is digest-eligible', async () => {
      await notificationRepo.setPreferences(employeeAlphaId, {
        inApp: true,
        email: true,
        push: false,
        digest: true,
      });

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'WEEKLY_UPDATE',
        title: 'گزارش هفتگی',
        message: 'به‌روزرسانی هفتگی پروژه',
        recipient: { email: 'employee@org-alpha.com' },
        digestEligible: true,
        priority: 'NORMAL',
      });

      expect(res.channels.email?.queuedForDigest).toBe(true);
      expect(res.channels.email?.delivered).toBe(false);
      expect(res.channels.inApp?.delivered).toBe(true);
    });

    it('bypasses digest deferral when priority is URGENT', async () => {
      await notificationRepo.setPreferences(employeeAlphaId, {
        inApp: true,
        email: true,
        push: false,
        digest: true,
      });

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'SYSTEM_ALERT',
        title: 'هشدار امنیتی',
        message: 'تلاش مشکوک به ورود شناسایی شد',
        recipient: { email: 'employee@org-alpha.com' },
        digestEligible: true,
        priority: 'URGENT',
      });

      expect(res.channels.email?.delivered).toBe(true);
      expect(res.channels.email?.queuedForDigest).toBeUndefined();
    });
  });

  describe('3. Quiet Hours / Sleep Mode Policy', () => {
    it('calculates quiet hours crossing midnight correctly', () => {
      const overnight = { enabled: true, start: '22:00', end: '08:00' };

      // 23:30 is inside quiet hours
      const nightDate = new Date('2026-10-24T23:30:00');
      expect(isWithinQuietHours(overnight, nightDate)).toBe(true);

      // 04:15 is inside quiet hours
      const earlyMorning = new Date('2026-10-24T04:15:00');
      expect(isWithinQuietHours(overnight, earlyMorning)).toBe(true);

      // 14:00 is outside quiet hours
      const afternoon = new Date('2026-10-24T14:00:00');
      expect(isWithinQuietHours(overnight, afternoon)).toBe(false);
    });

    it('calculates same-day quiet hours correctly', () => {
      const afternoonQuiet = { enabled: true, start: '13:00', end: '15:00' };

      const inWindow = new Date('2026-10-24T14:30:00');
      expect(isWithinQuietHours(afternoonQuiet, inWindow)).toBe(true);

      const afterWindow = new Date('2026-10-24T16:00:00');
      expect(isWithinQuietHours(afternoonQuiet, afterWindow)).toBe(false);
    });

    it('suppresses external disruptive channels during quiet hours for non-urgent notifications', async () => {
      await notificationRepo.setPreferences(employeeAlphaId, {
        inApp: true,
        email: true,
        push: true,
        sms: true,
        digest: false,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
      });

      const nightTime = new Date('2026-10-24T23:45:00');

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'TASK_COMMENT',
        title: 'کامنت جدید',
        message: 'یک کامنت جدید ثبت شد',
        priority: 'NORMAL',
        now: nightTime,
        recipient: {
          email: 'employee@org-alpha.com',
          pushToken: 'push_token_valid_12345678',
          phone: '09123456789',
        },
      });

      // In-app is delivered silently
      expect(res.channels.inApp?.delivered).toBe(true);

      // External channels are suppressed
      expect(res.channels.email?.suppressed).toBe(true);
      expect(res.channels.email?.suppressedReason).toContain('Quiet hours policy active');
      expect(res.channels.push?.suppressed).toBe(true);
      expect(res.channels.sms?.suppressed).toBe(true);
    });

    it('bypasses quiet hours when notification priority is URGENT', async () => {
      await notificationRepo.setPreferences(employeeAlphaId, {
        inApp: true,
        email: true,
        push: true,
        sms: true,
        digest: false,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
      });

      const nightTime = new Date('2026-10-24T23:45:00');

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'SYSTEM_ALERT',
        title: 'هشدار قطعی سیستم',
        message: 'سرور اصلی از دسترس خارج شد',
        priority: 'URGENT',
        now: nightTime,
        recipient: {
          email: 'employee@org-alpha.com',
          pushToken: 'push_token_valid_12345678',
          phone: '09123456789',
        },
      });

      expect(res.channels.inApp?.delivered).toBe(true);
      expect(res.channels.email?.delivered).toBe(true);
      expect(res.channels.push?.delivered).toBe(true);
      expect(res.channels.sms?.delivered).toBe(true);
    });
  });

  describe('4. Failure Handling, Retries & Dead-Letter Queue (DLQ)', () => {
    it('retries on failure and delivers without DLQ if a subsequent retry succeeds', async () => {
      let callCount = 0;
      emailAdapter.send = async () => {
        callCount++;
        if (callCount < 2) {
          return { success: false, error: 'Temporary connection drop' };
        }
        return { success: true, messageId: 'email_recovered_123' };
      };

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'TASK_ASSIGNED',
        title: 'تخصیص تسک',
        message: 'تسک بازیابی‌شده',
        recipient: { email: 'employee@org-alpha.com' },
      });

      expect(res.channels.email?.delivered).toBe(true);
      expect(res.channels.email?.retries).toBe(1); // succeeded on retry attempt
      expect(res.channels.email?.routedToDlq).toBeUndefined();

      // Should not be in DLQ
      const dlqList = await dlqRepo.findByOrg(orgAlpha);
      expect(dlqList.find((d) => d.title === 'تخصیص تسک')).toBeUndefined();
    });

    it('routes failed notification to DLQ after exhausting all retries', async () => {
      emailAdapter.setSimulateFailure(true, 'SMTP mail server connection timeout');

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'PAYMENT_FAILED',
        title: 'خطای پرداخت فاکتور',
        message: 'پرداخت فاکتور با شکست مواجه شد',
        recipient: { email: 'finance@org-alpha.com' },
      });

      expect(res.channels.email?.delivered).toBe(false);
      expect(res.channels.email?.routedToDlq).toBe(true);
      expect(res.channels.email?.dlqId).toBeDefined();
      expect(res.channels.email?.retries).toBe(3);

      const dlqItem = await dlqRepo.findById(orgAlpha, res.channels.email!.dlqId!);
      expect(dlqItem).toBeDefined();
      expect(dlqItem?.channel).toBe('email');
      expect(dlqItem?.recipient).toBe('finance@org-alpha.com');
      expect(dlqItem?.status).toBe('FAILED');
      expect(dlqItem?.retryCount).toBe(3);
      expect(dlqItem?.lastError).toContain('SMTP mail server connection timeout');
    });

    it('routes SMS persistent failure to DLQ with Iranian phone number metadata', async () => {
      await notificationRepo.setPreferences(employeeAlphaId, {
        inApp: false,
        email: false,
        push: false,
        digest: false,
        sms: true,
      });

      smsAdapter.setSimulateFailure(true, 'Kavenegar balance insufficient');

      const res = await dispatcherService.dispatch({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        type: 'SMS_NOTIFICATION',
        title: 'کد احراز هویت',
        message: 'کد: ۵۴۳۲۱',
        recipient: { phone: '09123456789' },
      });

      expect(res.channels.sms?.delivered).toBe(false);
      expect(res.channels.sms?.routedToDlq).toBe(true);

      const dlqItem = await dlqRepo.findById(orgAlpha, res.channels.sms!.dlqId!);
      expect(dlqItem).toBeDefined();
      expect(dlqItem?.channel).toBe('sms');
      expect(dlqItem?.recipient).toBe('09123456789');
    });
  });

  describe('5. Tenant Isolation & DLQ Scoping', () => {
    it('isolates dead-letter queue items strictly per organization', async () => {
      // Create DLQ item for org Alpha
      const dlqAlpha = await dlqRepo.create({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        channel: 'email',
        recipient: 'alpha@org.com',
        title: 'اعلان آلفا',
        message: 'متن آلفا',
        retryCount: 3,
        maxRetries: 3,
        lastError: 'Alpha failure',
        status: 'FAILED',
      });

      // Create DLQ item for org Beta
      const dlqBeta = await dlqRepo.create({
        organizationId: orgBeta,
        userId: employeeBetaId,
        channel: 'email',
        recipient: 'beta@org.com',
        title: 'اعلان بتا',
        message: 'متن بتا',
        retryCount: 3,
        maxRetries: 3,
        lastError: 'Beta failure',
        status: 'FAILED',
      });

      // Query Org Alpha
      const alphaList = await dispatcherService.getDeadLetters(orgAlpha);
      expect(alphaList.some((d) => d.id === dlqAlpha.id)).toBe(true);
      expect(alphaList.some((d) => d.id === dlqBeta.id)).toBe(false);

      // Query Org Beta
      const betaList = await dispatcherService.getDeadLetters(orgBeta);
      expect(betaList.some((d) => d.id === dlqBeta.id)).toBe(true);
      expect(betaList.some((d) => d.id === dlqAlpha.id)).toBe(false);
    });

    it('rejects retrying a DLQ notification belonging to another organization', async () => {
      // Create DLQ item in Beta
      const dlqBeta = await dlqRepo.create({
        organizationId: orgBeta,
        userId: employeeBetaId,
        channel: 'email',
        recipient: 'beta@test.com',
        title: 'پیام بتا',
        message: 'متن',
        retryCount: 3,
        maxRetries: 3,
        lastError: 'Err',
        status: 'FAILED',
      });

      // Alpha tries to retry Beta's DLQ item
      await expect(
        dispatcherService.retryDeadLetter(orgAlpha, dlqBeta.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('6. DLQ Controller Endpoints & Admin RBAC', () => {
    it('allows OrganizationAdmin to inspect dead-letter queue', async () => {
      const items = await notificationController.getDeadLetters(adminAlphaContext);
      expect(Array.isArray(items)).toBe(true);
      expect(items.every((i) => i.organizationId === orgAlpha)).toBe(true);
    });

    it('forbids non-admin users (Employee) from inspecting dead-letter queue', async () => {
      await expect(
        notificationController.getDeadLetters(employeeAlphaContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to retry a failed dead-letter notification successfully', async () => {
      // Seed a failed DLQ item for org Alpha
      const dlqEntry = await dlqRepo.create({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        channel: 'email',
        recipient: 'employee@org-alpha.com',
        title: 'اعلان تستی برای بازیابی',
        message: 'محتوا',
        retryCount: 3,
        maxRetries: 3,
        lastError: 'Previous timeout',
        status: 'FAILED',
      });

      // Retry via controller as Admin
      const result = await notificationController.retryDeadLetter(
        adminAlphaContext,
        dlqEntry.id,
      );

      expect(result.success).toBe(true);
      expect(result.item.status).toBe('RESOLVED');
      expect(result.item.resolvedAt).toBeDefined();
      expect(result.item.retryCount).toBe(4);
    });

    it('forbids non-admin users (Employee) from retrying dead-letter items', async () => {
      await expect(
        notificationController.retryDeadLetter(
          employeeAlphaContext,
          '88000000-0000-0000-0000-000000000001',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('records failed retry status if channel adapter continues to fail on retry', async () => {
      emailAdapter.setSimulateFailure(true, 'Server persistently unreachable');

      const dlqEntry = await dlqRepo.create({
        organizationId: orgAlpha,
        userId: employeeAlphaId,
        channel: 'email',
        recipient: 'employee@org-alpha.com',
        title: 'اعلان با خطای دائم',
        message: 'محتوا',
        retryCount: 3,
        maxRetries: 3,
        lastError: 'Server persistently unreachable',
        status: 'FAILED',
      });

      const result = await notificationController.retryDeadLetter(
        adminAlphaContext,
        dlqEntry.id,
      );

      expect(result.success).toBe(false);
      expect(result.item.status).toBe('FAILED');
      expect(result.item.retryCount).toBe(4);
      expect(result.item.lastError).toContain('Server persistently unreachable');
    });

    it('throws NotFoundException when retrying a non-existent DLQ id', async () => {
      await expect(
        notificationController.retryDeadLetter(adminAlphaContext, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('7. End-to-End Outbox Event Integration with Dispatcher', () => {
    it('dispatches multi-channel notification when TaskCreated event is processed', async () => {
      const event = {
        id: 'outbox-task-event-1',
        organizationId: orgAlpha,
        eventType: 'TaskCreated',
        aggregateType: 'Task',
        aggregateId: 'task-999',
        payload: {
          key: 'TSK-999',
          title: 'پیاده‌سازی ماژول اعلان‌ها',
          assigneeId: employeeAlphaId,
        },
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      };

      await notificationService.processEvent(event);

      // Verify in-app notification created
      const list = await notificationService.getMyNotifications(orgAlpha, employeeAlphaId);
      expect(list.some((n) => n.title === 'تخصیص وظیفه جدید')).toBe(true);

      // Verify audit log for email delivery
      const auditEvents = auditService.getEvents(orgAlpha);
      const emailAudit = auditEvents.find((a) => a.action === 'NOTIFICATION_EMAIL_SENT');
      expect(emailAudit).toBeDefined();
    });
  });
});
