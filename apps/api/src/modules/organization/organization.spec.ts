import { describe, expect, it, beforeEach } from 'vitest';
import { OrganizationService } from './organization.service.js';
import { AuditService } from '../audit/audit.service.js';
import { TokenService } from '../../common/auth/token.service.js';

describe('OrganizationService & Member Management (R-072, R-073, R-076)', () => {
  let orgService: OrganizationService;
  let auditService: AuditService;
  let tokenService: TokenService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const adminActorId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    auditService = new AuditService();
    tokenService = new TokenService();
    orgService = new OrganizationService(auditService, tokenService);
  });

  describe('Organization Workspace Settings', () => {
    it('retrieves organization settings with timezone and locale', async () => {
      const settings = await orgService.getSettings(orgAlpha);
      expect(settings.id).toBe(orgAlpha);
      expect(settings.name).toBe('شرکت آلفا (اصلی)');
      expect(settings.timezone).toBe('Asia/Tehran');
      expect(settings.locale).toBe('fa-IR');
    });

    it('updates organization settings and logs audit event', async () => {
      const updated = await orgService.updateSettings(orgAlpha, adminActorId, {
        name: 'هلدینگ بین‌المللی آلفا',
        timezone: 'Asia/Tehran',
        retentionPolicy: {
          auditLogsDays: 180,
          tempFilesDays: 14,
        },
      });

      expect(updated.name).toBe('هلدینگ بین‌المللی آلفا');
      expect(updated.retentionPolicy?.auditLogsDays).toBe(180);

      // Verify persistence
      const fresh = await orgService.getSettings(orgAlpha);
      expect(fresh.name).toBe('هلدینگ بین‌المللی آلفا');
    });
  });

  describe('Member Lifecycle & Management', () => {
    it('lists all members belonging to the organization', async () => {
      const members = await orgService.getMembers(orgAlpha);
      expect(members.length).toBeGreaterThanOrEqual(3);
      expect(members.some((m) => m.role === 'SystemOwner')).toBe(true);
      expect(members.some((m) => m.email === 'employee@org-alpha.com')).toBe(true);
    });

    it('invites a new member with specified role and logs audit event', async () => {
      const newMember = await orgService.inviteMember(orgAlpha, adminActorId, {
        email: 'sales.manager@org-alpha.com',
        displayName: 'آرش علوی',
        role: 'Sales',
      });

      expect(newMember.id).toBeDefined();
      expect(newMember.email).toBe('sales.manager@org-alpha.com');
      expect(newMember.role).toBe('Sales');
      expect(newMember.active).toBe(true);

      const members = await orgService.getMembers(orgAlpha);
      expect(members.some((m) => m.email === 'sales.manager@org-alpha.com')).toBe(true);
    });

    it('updates existing member role to Manager', async () => {
      const updated = await orgService.updateMemberRole(
        orgAlpha,
        adminActorId,
        'mem-002', // سارا احمدی (Employee)
        'Manager',
      );

      expect(updated.role).toBe('Manager');

      const members = await orgService.getMembers(orgAlpha);
      const found = members.find((m) => m.id === 'mem-002');
      expect(found?.role).toBe('Manager');
    });

    it('revokes member and invalidates all issued tokens for that user', async () => {
      const res = await orgService.revokeMember(
        orgAlpha,
        adminActorId,
        'mem-003', // پویا مرادی
      );

      expect(res.success).toBe(true);

      const members = await orgService.getMembers(orgAlpha);
      const found = members.find((m) => m.id === 'mem-003');
      expect(found?.active).toBe(false);

      // Security check: Verify tokenService user revocation blacklist holds this user
      expect(tokenService.isRevoked({ sub: '55555555-5555-5555-5555-555555555555', iat: 100 } as any)).toBe(true);
    });

    it('strictly forbids revoking or suspending SystemOwner', async () => {
      await expect(
        orgService.revokeMember(orgAlpha, adminActorId, 'mem-001'),
      ).rejects.toThrow('امکان تعلیق یا لغو عضویت مالک سیستم (SystemOwner) وجود ندارد');
    });
  });

  describe('Role & Permission Matrix Reference', () => {
    it('returns all 9 canonical membership roles and permissions matrix', () => {
      const data = orgService.getRoleMatrix();
      expect(data.roles).toHaveLength(9);
      expect(data.roles).toContain('SystemOwner');
      expect(data.roles).toContain('OrganizationAdmin');
      expect(data.roles).toContain('CustomerPortalUser');
      expect(data.matrix.SystemOwner).toBeDefined();
      expect(data.matrix.CustomerPortalUser).toBeDefined();
    });
  });
});
