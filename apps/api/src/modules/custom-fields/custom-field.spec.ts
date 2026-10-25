import { describe, expect, it, beforeEach } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CustomFieldService } from './custom-field.service.js';
import { InMemoryCustomFieldRepository } from './custom-field.repository.js';
import { AuditService } from '../audit/audit.service.js';

describe('Custom Fields & Dynamic Schema (R-039 & R-077)', () => {
  let fieldService: CustomFieldService;
  let fieldRepo: InMemoryCustomFieldRepository;
  let auditService: AuditService;

  const orgAlpha = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgBeta = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const adminActorId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    fieldRepo = new InMemoryCustomFieldRepository();
    auditService = new AuditService();
    fieldService = new CustomFieldService(fieldRepo, auditService);
  });

  describe('Listing & Filtering', () => {
    it('returns seeded fields for organization and respects entityType filter', async () => {
      const allFields = await fieldService.getFields(orgAlpha);
      expect(allFields.length).toBeGreaterThanOrEqual(3);
      expect(allFields.some((f) => f.key === 'national_id')).toBe(true);

      const dealFields = await fieldService.getFields(orgAlpha, 'DEAL');
      expect(dealFields.length).toBe(1);
      expect(dealFields[0]?.key).toBe('channel_source');

      const betaFields = await fieldService.getFields(orgBeta);
      expect(betaFields.length).toBe(0);
    });
  });

  describe('Creation & Validation', () => {
    it('creates custom field, normalizes key, and logs audit event', async () => {
      const created = await fieldService.createField(orgAlpha, adminActorId, {
        entityType: 'LEAD',
        key: 'marketing-campaign',
        label: 'نام کمپین بازاریابی',
        type: 'TEXT',
        isRequired: true,
      });

      expect(created.id).toBeDefined();
      expect(created.key).toBe('marketing_campaign'); // hyphen converted to underscore
      expect(created.isRequired).toBe(true);

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'CUSTOM_FIELD_CREATED');
      expect(audit).toBeDefined();
    });

    it('rejects duplicate field key for the same entity type with 409 Conflict', async () => {
      await expect(
        fieldService.createField(orgAlpha, adminActorId, {
          entityType: 'ACCOUNT',
          key: 'national_id', // Duplicate of seeded field
          label: 'کد اقتصادی دیگر',
          type: 'TEXT',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects SELECT field without options', async () => {
      await expect(
        fieldService.createField(orgAlpha, adminActorId, {
          entityType: 'TICKET',
          key: 'issue_category',
          label: 'دسته‌بندی موضوع',
          type: 'SELECT',
          options: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Server-side Values Validation', () => {
    it('validates required fields, numeric types, and allowed select options', async () => {
      // Seeded ACCOUNT has required 'national_id'
      const invalidRequired = await fieldService.validateValues(orgAlpha, 'ACCOUNT', {});
      expect(invalidRequired.isValid).toBe(false);
      expect(invalidRequired.errors[0]?.fieldKey).toBe('national_id');

      // Seeded TASK has 'estimated_hours' (NUMBER)
      const invalidNumber = await fieldService.validateValues(orgAlpha, 'TASK', {
        estimated_hours: 'not-a-number',
      });
      expect(invalidNumber.isValid).toBe(false);
      expect(invalidNumber.errors[0]?.fieldKey).toBe('estimated_hours');

      // Seeded DEAL has 'channel_source' (SELECT: ['نمایشگاه تخصصی', 'معرفی مشتری سابق', ...])
      const invalidSelect = await fieldService.validateValues(orgAlpha, 'DEAL', {
        channel_source: 'گزینه غیرمجاز',
      });
      expect(invalidSelect.isValid).toBe(false);
      expect(invalidSelect.errors[0]?.fieldKey).toBe('channel_source');

      // Valid values pass validation
      const valid = await fieldService.validateValues(orgAlpha, 'ACCOUNT', {
        national_id: '10100234567',
      });
      expect(valid.isValid).toBe(true);
      expect(valid.errors).toHaveLength(0);
    });
  });

  describe('Update & Deletion', () => {
    it('updates field label and soft archives field', async () => {
      const updated = await fieldService.updateField(orgAlpha, adminActorId, 'cf-001', {
        label: 'شناسه ملی و شماره ثبت شرکت',
        isRequired: false,
      });

      expect(updated.label).toBe('شناسه ملی و شماره ثبت شرکت');
      expect(updated.isRequired).toBe(false);

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'CUSTOM_FIELD_UPDATED');
      expect(audit).toBeDefined();
    });

    it('deletes field and records audit event', async () => {
      const res = await fieldService.deleteField(orgAlpha, adminActorId, 'cf-003');
      expect(res.success).toBe(true);

      const fields = await fieldService.getFields(orgAlpha, 'TASK');
      expect(fields.length).toBe(0);

      const audit = auditService.getEvents(orgAlpha).find((a) => a.action === 'CUSTOM_FIELD_DELETED');
      expect(audit).toBeDefined();
    });
  });
});
