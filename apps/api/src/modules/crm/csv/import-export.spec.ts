import { describe, expect, it, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import {
  parseCsv,
  parseCsvRows,
  generateCsv,
  generateCsvFromObjects,
  escapeCsvField,
} from './csv-parser.js';
import { ImportExportService } from './import-export.service.js';
import { ImportExportController } from './import-export.controller.js';
import { InMemoryCrmRepository } from '../crm.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { AuthService } from '../../../common/auth/auth.service.js';
import { PermissionsGuard } from '../../../common/auth/permissions.guard.js';

describe('CSV Import/Export Engine (Task F5-06)', () => {
  let crmRepo: InMemoryCrmRepository;
  let auditService: AuditService;
  let importExportService: ImportExportService;
  let importExportController: ImportExportController;
  let authService: AuthService;

  const orgAlphaId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBetaId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const employeeAlphaId = '22222222-2222-2222-2222-222222222222';
  const adminAlphaId = '11111111-1111-1111-1111-111111111111';
  const customerId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    crmRepo = new InMemoryCrmRepository();
    auditService = new AuditService();
    importExportService = new ImportExportService(crmRepo, auditService);
    importExportController = new ImportExportController(importExportService);
    authService = new AuthService();
  });

  describe('1. CSV Parser & Generator', () => {
    it('parses standard CSV with English headers and values', () => {
      const csv = 'displayName,email,phone\nJohn Doe,john@example.com,09121112233\nJane Smith,jane@example.com,09123334455';
      const parsed = parseCsv(csv);

      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({
        displayName: 'John Doe',
        email: 'john@example.com',
        phone: '09121112233',
      });
      expect(parsed[1]?.displayName).toBe('Jane Smith');
    });

    it('parses Persian text headers and values accurately', () => {
      const csv = 'نام,ایمیل,تلفن\nعلی رضایی,ali@novin.ir,۰۹۱۲۳۴۵۶۷۸۹\nسارا محمدی,sara@novin.ir,۰۹۳۵۱۱۱۲۲۳۳';
      const parsed = parseCsv(csv);

      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toEqual({
        'نام': 'علی رضایی',
        'ایمیل': 'ali@novin.ir',
        'تلفن': '۰۹۱۲۳۴۵۶۷۸۹',
      });
      expect(parsed[1]?.['نام']).toBe('سارا محمدی');
    });

    it('handles quoted fields with embedded commas and Persian punctuation', () => {
      const csv = 'displayName,email,address\n"شرکت توسعه، تجارت و فناوری",info@tt.ir,"تهران، میدان آزادی، پلاک ۱۰"';
      const parsed = parseCsv(csv);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]?.displayName).toBe('شرکت توسعه، تجارت و فناوری');
      expect(parsed[0]?.email).toBe('info@tt.ir');
      expect(parsed[0]?.address).toBe('تهران، میدان آزادی، پلاک ۱۰');
    });

    it('handles escaped quotes inside quoted fields correctly', () => {
      const csv = 'displayName,note\n"شرکت ""فولاد آرا""",توضیح تستی';
      const parsed = parseCsv(csv);

      expect(parsed).toHaveLength(1);
      expect(parsed[0]?.displayName).toBe('شرکت "فولاد آرا"');
      expect(parsed[0]?.note).toBe('توضیح تستی');
    });

    it('supports Windows CRLF and trailing empty lines', () => {
      const csv = 'displayName,email\r\nUser One,one@test.com\r\nUser Two,two@test.com\r\n\r\n';
      const parsed = parseCsv(csv);

      expect(parsed).toHaveLength(2);
      expect(parsed[1]?.email).toBe('two@test.com');
    });

    it('escapes and formats CSV generation properly', () => {
      const headers = ['name', 'city', 'note'];
      const rows = [
        ['شرکت نمونه', 'تهران, میدان ونک', 'پیام "ویژه"'],
        ['Normal Co', 'Shiraz', 'Simple'],
      ];

      const generated = generateCsv(headers, rows);
      expect(generated).toContain('"تهران, میدان ونک"');
      expect(generated).toContain('"پیام ""ویژه"""');

      // Round-trip parse
      const reParsed = parseCsv(generated);
      expect(reParsed).toHaveLength(2);
      expect(reParsed[0]?.name).toBe('شرکت نمونه');
      expect(reParsed[0]?.city).toBe('تهران, میدان ونک');
      expect(reParsed[0]?.note).toBe('پیام "ویژه"');
    });

    it('generates CSV from objects', () => {
      const items = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' },
      ];
      const csv = generateCsvFromObjects(items);
      expect(csv).toContain('id,title');
      expect(csv).toContain('1,Task 1');
      expect(csv).toContain('2,Task 2');
    });
  });

  describe('2. Validation & Dry-Run Lead Import Preview', () => {
    it('validates and previews clean lead CSV without writing to repository', async () => {
      const csv = `displayName,email,phone,source
محمد کریمی,karimi@parstoos.ir,09121114477,WEBSITE
زهرا احمدی,ahmadi@parstoos.ir,09122223344,REFERRAL`;

      const initialLeads = await crmRepo.findLeads(orgAlphaId);
      const preview = await importExportService.previewLeadImport(orgAlphaId, csv);

      expect(preview.validCount).toBe(2);
      expect(preview.invalidCount).toBe(0);
      expect(preview.errors).toHaveLength(0);
      expect(preview.sample).toHaveLength(2);
      expect(preview.sample[0]?.displayName).toBe('محمد کریمی');
      expect(preview.sample[0]?.email).toBe('karimi@parstoos.ir');

      // Dry run verification: no records created in repository
      const leadsAfter = await crmRepo.findLeads(orgAlphaId);
      expect(leadsAfter.length).toBe(initialLeads.length);

      // No audit events logged for preview
      const auditEvents = auditService.getEvents(orgAlphaId);
      expect(auditEvents.filter((e) => e.action === 'CRM_IMPORT_EXECUTED')).toHaveLength(0);
    });

    it('reports missing required fields and invalid email with row numbers', async () => {
      const csv = `displayName,email,phone
,valid@email.com,09120000001
نامعتبر,not-an-email,09120000002
,bad-email-and-no-name,09120000003
کاربر معتبر,valid.user@company.com,09120000004`;

      const preview = await importExportService.previewLeadImport(orgAlphaId, csv);

      expect(preview.validCount).toBe(1);
      expect(preview.invalidCount).toBe(3);

      // Row 2: missing displayName
      const row2Error = preview.errors.find((e) => e.row === 2);
      expect(row2Error).toBeDefined();
      expect(row2Error?.field).toBe('displayName');

      // Row 3: invalid email
      const row3Error = preview.errors.find((e) => e.row === 3);
      expect(row3Error).toBeDefined();
      expect(row3Error?.field).toBe('email');

      // Row 4: both missing displayName and bad email
      const row4Errors = preview.errors.filter((e) => e.row === 4);
      expect(row4Errors.length).toBe(2);
      expect(row4Errors.some((e) => e.field === 'displayName')).toBe(true);
      expect(row4Errors.some((e) => e.field === 'email')).toBe(true);

      // Sample contains the valid row only
      expect(preview.sample).toHaveLength(1);
      expect(preview.sample[0]?.displayName).toBe('کاربر معتبر');
    });

    it('supports Persian header mapping in preview', async () => {
      const csv = `نام و نام خانوادگی,پست الکترونیک,شماره تلفن,منبع
کامران داودی,kamran@co.ir,09123456789,نمایشگاه`;

      const preview = await importExportService.previewLeadImport(orgAlphaId, csv);
      expect(preview.validCount).toBe(1);
      expect(preview.invalidCount).toBe(0);
      expect(preview.sample[0]?.displayName).toBe('کامران داودی');
      expect(preview.sample[0]?.email).toBe('kamran@co.ir');
      expect(preview.sample[0]?.phone).toBe('09123456789');
      expect(preview.sample[0]?.source).toBe('نمایشگاه');
    });

    it('returns empty preview for empty or whitespace-only CSV', async () => {
      const preview = await importExportService.previewLeadImport(orgAlphaId, '   \n  \r\n');
      expect(preview.validCount).toBe(0);
      expect(preview.invalidCount).toBe(0);
      expect(preview.errors).toHaveLength(0);
      expect(preview.sample).toHaveLength(0);
    });
  });

  describe('3. Execution & Deduplication Checking', () => {
    it('executes import for valid leads and creates records in repository', async () => {
      const csv = `displayName,email,phone,source
مهرداد قاسمی,mehrdad.ghasemi@tech.ir,09121110022,INBOUND
نیلوفر نوری,niloofar.noori@tech.ir,09121110033,OUTBOUND`;

      const result = await importExportService.executeLeadImport(
        orgAlphaId,
        employeeAlphaId,
        csv,
      );

      expect(result.importedCount).toBe(2);
      expect(result.duplicatesFound).toBe(0);

      const leads = await crmRepo.findLeads(orgAlphaId);
      const imported1 = leads.find((l) => l.email === 'mehrdad.ghasemi@tech.ir');
      const imported2 = leads.find((l) => l.email === 'niloofar.noori@tech.ir');

      expect(imported1).toBeDefined();
      expect(imported1?.displayName).toBe('مهرداد قاسمی');
      expect(imported1?.organizationId).toBe(orgAlphaId);
      expect(imported1?.status).toBe('NEW');

      expect(imported2).toBeDefined();

      // Audit trail logged
      const audits = auditService
        .getEvents(orgAlphaId)
        .filter((e) => e.action === 'CRM_IMPORT_EXECUTED');
      expect(audits).toHaveLength(1);
      expect(audits[0]?.actorId).toBe(employeeAlphaId);
      expect(audits[0]?.metadata?.['importedCount']).toBe(2);
      expect(audits[0]?.metadata?.['duplicatesFound']).toBe(0);
    });

    it('detects and skips duplicates against existing repository leads', async () => {
      // Seed lead in orgAlpha has email: hosseini@dadevarz.com and phone: 09129876543
      const csv = `displayName,email,phone
علیرضا حسینی تکراری,hosseini@dadevarz.com,09120000000
سرنخ جدید یکتا,new.client@company.com,09199998877`;

      const result = await importExportService.executeLeadImport(
        orgAlphaId,
        employeeAlphaId,
        csv,
      );

      expect(result.importedCount).toBe(1);
      expect(result.duplicatesFound).toBe(1);

      // Verify the new unique lead was created
      const leads = await crmRepo.findLeads(orgAlphaId);
      expect(leads.some((l) => l.email === 'new.client@company.com')).toBe(true);

      // Duplicate lead was not created as duplicate record
      const matchExisting = leads.filter((l) => l.email === 'hosseini@dadevarz.com');
      expect(matchExisting).toHaveLength(1); // Only the original seed record
    });

    it('detects intra-batch duplicates within the same CSV file', async () => {
      const csv = `displayName,email,phone
کاربر اول,batch.dup@company.com,09121111111
کاربر دوم هم‌نام,BATCH.DUP@COMPANY.COM,09122222222
کاربر سوم با همان تلفن,third@company.com,09121111111`;

      const result = await importExportService.executeLeadImport(
        orgAlphaId,
        employeeAlphaId,
        csv,
      );

      // First one imported, second (duplicate email) and third (duplicate phone) skipped
      expect(result.importedCount).toBe(1);
      expect(result.duplicatesFound).toBe(2);
    });

    it('skips invalid rows during execution while importing valid non-duplicate rows', async () => {
      const csv = `displayName,email,phone
,no-name@test.com,09120000001
کاربر ایمیل نامعتبر,invalid-email-address,09120000002
کاربر کاملاً سالم,healthy@test.com,09120000003`;

      const result = await importExportService.executeLeadImport(
        orgAlphaId,
        employeeAlphaId,
        csv,
      );

      expect(result.importedCount).toBe(1);
      expect(result.duplicatesFound).toBe(0);

      const leads = await crmRepo.findLeads(orgAlphaId);
      expect(leads.some((l) => l.email === 'healthy@test.com')).toBe(true);
    });
  });

  describe('4. Export CSV Formatting & Audit Trail', () => {
    it('exports leads CSV with standard headers and records audit', async () => {
      const csv = await importExportService.exportLeadsCsv(orgAlphaId, employeeAlphaId);

      expect(csv).toContain('id,displayName,email,phone,source,status,createdAt');
      expect(csv).toContain('علیرضا حسینی - شرکت داده‌ورز');
      expect(csv).toContain('hosseini@dadevarz.com');

      const audits = auditService
        .getEvents(orgAlphaId)
        .filter((e) => e.action === 'CRM_EXPORT_EXECUTED');
      expect(audits).toHaveLength(1);
      expect(audits[0]?.actorId).toBe(employeeAlphaId);
      expect(audits[0]?.entityType).toBe('Lead');
      expect(audits[0]?.metadata?.['exportType']).toBe('leads');
    });

    it('exports contacts CSV with correct headers and data', async () => {
      const csv = await importExportService.exportContactsCsv(orgAlphaId, employeeAlphaId);

      expect(csv).toContain('id,firstName,lastName,email,phone,accountId,createdAt');
      expect(csv).toContain('محمد');
      expect(csv).toContain('رضایی');
      expect(csv).toContain('m.rezaei@foolad-arya.com');

      const audits = auditService
        .getEvents(orgAlphaId)
        .filter((e) => e.action === 'CRM_EXPORT_EXECUTED' && e.entityType === 'Contact');
      expect(audits).toHaveLength(1);
    });

    it('exports accounts CSV with correct headers and data', async () => {
      const csv = await importExportService.exportAccountsCsv(orgAlphaId, employeeAlphaId);

      expect(csv).toContain('id,name,type,status,website,phone,createdAt');
      expect(csv).toContain('فولاد گستر آریا');
      expect(csv).toContain('https://foolad-arya.com');

      const audits = auditService
        .getEvents(orgAlphaId)
        .filter((e) => e.action === 'CRM_EXPORT_EXECUTED' && e.entityType === 'Account');
      expect(audits).toHaveLength(1);
    });
  });

  describe('5. Cross-Tenant Isolation', () => {
    it('strictly isolates exported accounts between organizations', async () => {
      const alphaCsv = await importExportService.exportAccountsCsv(orgAlphaId);
      const betaCsv = await importExportService.exportAccountsCsv(orgBetaId);

      // Org Alpha has 'فولاد گستر آریا'
      expect(alphaCsv).toContain('فولاد گستر آریا');
      // Org Alpha MUST NOT leak Org Beta's account
      expect(alphaCsv).not.toContain('سازمان بتا پارتنر');

      // Org Beta has 'سازمان بتا پارتنر'
      expect(betaCsv).toContain('سازمان بتا پارتنر');
      // Org Beta MUST NOT leak Org Alpha's account
      expect(betaCsv).not.toContain('فولاد گستر آریا');
    });

    it('strictly isolates exported leads between organizations', async () => {
      const alphaCsv = await importExportService.exportLeadsCsv(orgAlphaId);
      const betaCsv = await importExportService.exportLeadsCsv(orgBetaId);

      expect(alphaCsv).toContain('hosseini@dadevarz.com');
      expect(betaCsv).not.toContain('hosseini@dadevarz.com');
    });

    it('scopes deduplication strictly to the importing tenant', async () => {
      // hosseini@dadevarz.com already exists in Org Alpha.
      // Org Beta should be allowed to import a lead with the same email!
      const csv = `displayName,email,phone
حسینی شعبه بتا,hosseini@dadevarz.com,09129876543`;

      const betaResult = await importExportService.executeLeadImport(
        orgBetaId,
        'user-beta',
        csv,
      );

      expect(betaResult.importedCount).toBe(1);
      expect(betaResult.duplicatesFound).toBe(0);

      // Verify lead belongs to Org Beta
      const betaLeads = await crmRepo.findLeads(orgBetaId);
      expect(betaLeads.some((l) => l.displayName === 'حسینی شعبه بتا')).toBe(true);
    });
  });

  describe('6. Controller & Permission Matrix Enforcement', () => {
    it('invokes controller preview and execute endpoints', async () => {
      const adminUser = await authService.resolveUser(adminAlphaId);

      const previewRes = await importExportController.previewLeadImport(adminUser, {
        csv: 'displayName,email\nتست کنترلر,test.ctrl@org.com',
      });
      expect(previewRes.validCount).toBe(1);

      const execRes = await importExportController.executeLeadImport(adminUser, {
        csv: 'displayName,email\nتست کنترلر,test.ctrl@org.com',
      });
      expect(execRes.importedCount).toBe(1);

      const leadsCsv = await importExportController.exportLeads(adminUser);
      expect(leadsCsv).toContain('test.ctrl@org.com');
    });

    it('enforces export_data permission: Employee is forbidden from exporting data', async () => {
      // Employee role has export_data: 'no'
      const employee = await authService.resolveUser(employeeAlphaId);
      const mockContext: any = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: employee }),
        }),
      };

      const exportGuard = new PermissionsGuard({
        getAllAndOverride: () => 'export_data',
      } as any);

      expect(() => exportGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('allows SystemOwner to export data', async () => {
      // SystemOwner has export_data: 'yes'
      const admin = await authService.resolveUser(adminAlphaId);
      const mockContext: any = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: admin }),
        }),
      };

      const exportGuard = new PermissionsGuard({
        getAllAndOverride: () => 'export_data',
      } as any);

      expect(exportGuard.canActivate(mockContext)).toBe(true);
    });

    it('enforces edit_crm permission: CustomerPortalUser is forbidden from importing data', async () => {
      // CustomerPortalUser has edit_crm: 'no'
      const customer = await authService.resolveUser(customerId);
      const mockContext: any = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({ user: customer }),
        }),
      };

      const importGuard = new PermissionsGuard({
        getAllAndOverride: () => 'edit_crm',
      } as any);

      expect(() => importGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });
  });
});
