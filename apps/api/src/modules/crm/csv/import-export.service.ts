import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  isDuplicateCandidate,
  normalizeEmail,
  normalizePhone,
  type DeduplicationCandidate,
} from '@crm/domain';
import { InMemoryCrmRepository } from '../crm.repository.js';
import { AuditService } from '../../audit/audit.service.js';
import { generateCsv, parseCsv } from './csv-parser.js';

export type LeadImportError = {
  row: number;
  field: string;
  message: string;
};

export type LeadImportPreviewResult = {
  validCount: number;
  invalidCount: number;
  errors: LeadImportError[];
  sample: any[];
};

export type LeadImportExecuteResult = {
  importedCount: number;
  duplicatesFound: number;
};

export type ParsedLeadFields = {
  displayName?: string;
  email?: string;
  phone?: string;
  source?: string;
};

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export function extractLeadRow(record: Record<string, string>): ParsedLeadFields {
  const result: ParsedLeadFields = {};

  for (const [key, value] of Object.entries(record)) {
    const normKey = key.trim().toLowerCase().replace(/[\s_\-]/g, '');
    const val = value !== undefined ? value.trim() : '';

    if (
      [
        'displayname',
        'name',
        'fullname',
        'title',
        'نام',
        'نامکامل',
        'نامنمایشی',
        'نامونامخانوادگی',
      ].includes(normKey)
    ) {
      if (!result.displayName) result.displayName = val;
    } else if (
      [
        'email',
        'mail',
        'emailaddress',
        'ایمیل',
        'پستالکترونیک',
        'رایانامه',
      ].includes(normKey)
    ) {
      if (!result.email) result.email = val;
    } else if (
      [
        'phone',
        'phonenumber',
        'mobile',
        'tel',
        'cell',
        'تلفن',
        'شمارهتلفن',
        'موبایل',
        'شمارههمراه',
        'تلفنهمراه',
      ].includes(normKey)
    ) {
      if (!result.phone) result.phone = val;
    } else if (
      ['source', 'leadsource', 'منبع', 'منبعسرنخ'].includes(normKey)
    ) {
      if (!result.source) result.source = val;
    }
  }

  return result;
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    private readonly crmRepo: InMemoryCrmRepository,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Dry-run preview of leads CSV import.
   * Validates each row, reports row-by-row errors, and returns a sample preview.
   * Does NOT write to the repository or audit log.
   */
  async previewLeadImport(
    organizationId: string,
    csvContent: string,
  ): Promise<LeadImportPreviewResult> {
    if (!csvContent || !csvContent.trim()) {
      return {
        validCount: 0,
        invalidCount: 0,
        errors: [],
        sample: [],
      };
    }

    const records = parseCsv(csvContent);
    if (records.length === 0) {
      return {
        validCount: 0,
        invalidCount: 0,
        errors: [],
        sample: [],
      };
    }

    let validCount = 0;
    let invalidCount = 0;
    const errors: LeadImportError[] = [];
    const sample: any[] = [];

    records.forEach((record, idx) => {
      // Row 1 is headers in standard CSV, so first data row is 2
      const rowNum = idx + 2;
      const row = extractLeadRow(record);
      let isRowValid = true;

      if (!row.displayName) {
        errors.push({
          row: rowNum,
          field: 'displayName',
          message: 'displayName is required',
        });
        isRowValid = false;
      }

      if (row.email && !isValidEmail(row.email)) {
        errors.push({
          row: rowNum,
          field: 'email',
          message: 'Invalid email address format',
        });
        isRowValid = false;
      }

      if (isRowValid) {
        validCount++;
        if (sample.length < 5) {
          sample.push({
            displayName: row.displayName,
            email: row.email ? normalizeEmail(row.email) : null,
            phone: row.phone ? normalizePhone(row.phone) : null,
            source: row.source || 'IMPORT',
          });
        }
      } else {
        invalidCount++;
      }
    });

    return {
      validCount,
      invalidCount,
      errors,
      sample,
    };
  }

  /**
   * Executes leads CSV import strictly within the organization scope.
   * Performs deduplication checking against existing leads and earlier batch entries.
   * Logs CRM_IMPORT_EXECUTED in the audit trail.
   */
  async executeLeadImport(
    organizationId: string,
    actorId: string,
    csvContent: string,
  ): Promise<LeadImportExecuteResult> {
    if (!csvContent || !csvContent.trim()) {
      this.auditService.record({
        organizationId,
        actorId,
        action: 'CRM_IMPORT_EXECUTED',
        entityType: 'Lead',
        entityId: randomUUID(),
        metadata: { importedCount: 0, duplicatesFound: 0 },
      });
      return { importedCount: 0, duplicatesFound: 0 };
    }

    const records = parseCsv(csvContent);
    const existingLeads = await this.crmRepo.findLeads(organizationId);

    const knownCandidates: DeduplicationCandidate[] = existingLeads.map((l) => ({
      email: l.email ? normalizeEmail(l.email) : null,
      phone: l.phone ? normalizePhone(l.phone) : null,
    }));

    let importedCount = 0;
    let duplicatesFound = 0;

    for (const record of records) {
      const row = extractLeadRow(record);

      // Skip rows failing basic validation
      if (!row.displayName) {
        continue;
      }
      if (row.email && !isValidEmail(row.email)) {
        continue;
      }

      const normEmail = row.email ? normalizeEmail(row.email) : null;
      const normPhone = row.phone ? normalizePhone(row.phone) : null;

      const candidate: DeduplicationCandidate = {
        email: normEmail,
        phone: normPhone,
      };

      const isDuplicate = knownCandidates.some((existing) =>
        isDuplicateCandidate(existing, candidate),
      );

      if (isDuplicate) {
        duplicatesFound++;
        continue;
      }

      await this.crmRepo.createLead({
        organizationId,
        ownerId: actorId,
        accountId: null,
        displayName: row.displayName,
        email: normEmail,
        phone: normPhone,
        source: row.source || 'CSV_IMPORT',
        status: 'NEW',
      });

      knownCandidates.push(candidate);
      importedCount++;
    }

    this.auditService.record({
      organizationId,
      actorId,
      action: 'CRM_IMPORT_EXECUTED',
      entityType: 'Lead',
      entityId: randomUUID(),
      metadata: {
        importedCount,
        duplicatesFound,
      },
    });

    this.logger.log(
      `[IMPORT] org=${organizationId} imported=${importedCount} duplicates=${duplicatesFound}`,
    );

    return { importedCount, duplicatesFound };
  }

  /**
   * Exports leads belonging to the organization as an RFC 4180 CSV string.
   * Logs CRM_EXPORT_EXECUTED in the audit trail.
   */
  async exportLeadsCsv(organizationId: string, actorId?: string): Promise<string> {
    const leads = await this.crmRepo.findLeads(organizationId);
    const headers = [
      'id',
      'displayName',
      'email',
      'phone',
      'source',
      'status',
      'createdAt',
    ];
    const rows = leads.map((l) => [
      l.id,
      l.displayName,
      l.email ?? '',
      l.phone ?? '',
      l.source ?? '',
      l.status,
      l.createdAt,
    ]);

    const csv = generateCsv(headers, rows);

    this.auditService.record({
      organizationId,
      actorId: actorId ?? null,
      action: 'CRM_EXPORT_EXECUTED',
      entityType: 'Lead',
      entityId: randomUUID(),
      metadata: { recordCount: leads.length, exportType: 'leads' },
    });

    return csv;
  }

  /**
   * Exports contacts belonging to the organization as an RFC 4180 CSV string.
   * Logs CRM_EXPORT_EXECUTED in the audit trail.
   */
  async exportContactsCsv(organizationId: string, actorId?: string): Promise<string> {
    const contacts = await this.crmRepo.findContacts(organizationId);
    const headers = [
      'id',
      'firstName',
      'lastName',
      'email',
      'phone',
      'accountId',
      'createdAt',
    ];
    const rows = contacts.map((c) => [
      c.id,
      c.firstName,
      c.lastName,
      c.email ?? '',
      c.phone ?? '',
      c.accountId ?? '',
      c.createdAt,
    ]);

    const csv = generateCsv(headers, rows);

    this.auditService.record({
      organizationId,
      actorId: actorId ?? null,
      action: 'CRM_EXPORT_EXECUTED',
      entityType: 'Contact',
      entityId: randomUUID(),
      metadata: { recordCount: contacts.length, exportType: 'contacts' },
    });

    return csv;
  }

  /**
   * Exports accounts belonging to the organization as an RFC 4180 CSV string.
   * Logs CRM_EXPORT_EXECUTED in the audit trail.
   */
  async exportAccountsCsv(organizationId: string, actorId?: string): Promise<string> {
    const accounts = await this.crmRepo.findAccounts(organizationId);
    const headers = [
      'id',
      'name',
      'type',
      'status',
      'website',
      'phone',
      'createdAt',
    ];
    const rows = accounts.map((a) => [
      a.id,
      a.name,
      a.type,
      a.status,
      a.website ?? '',
      a.phone ?? '',
      a.createdAt,
    ]);

    const csv = generateCsv(headers, rows);

    this.auditService.record({
      organizationId,
      actorId: actorId ?? null,
      action: 'CRM_EXPORT_EXECUTED',
      entityType: 'Account',
      entityId: randomUUID(),
      metadata: { recordCount: accounts.length, exportType: 'accounts' },
    });

    return csv;
  }
}
