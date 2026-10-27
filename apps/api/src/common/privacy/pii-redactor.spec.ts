import { describe, expect, it } from 'vitest';
import { maskEmail, maskPhone, redactObject, redactString } from './pii-redactor.js';
import { DataRetentionService } from './data-retention.service.js';

describe('PII Redactor and Data Retention (F4-06)', () => {
  describe('maskEmail', () => {
    it('masks email username while keeping domain', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j***e@example.com');
      expect(maskEmail('me@test.com')).toBe('m***@test.com');
    });

    it('handles invalid email gracefully', () => {
      expect(maskEmail('invalid')).toBe('[REDACTED_EMAIL]');
    });
  });

  describe('maskPhone', () => {
    it('masks middle digits of phone number', () => {
      expect(maskPhone('09123456789')).toBe('0912****789');
    });

    it('handles short strings safely', () => {
      expect(maskPhone('123')).toBe('[REDACTED_PHONE]');
    });
  });

  describe('redactString', () => {
    it('redacts bearer tokens', () => {
      const input = 'Authorization: Bearer secret_token_123456';
      expect(redactString(input)).toBe('Authorization: Bearer [REDACTED]');
    });

    it('redacts github tokens', () => {
      const input = 'Token gho_123456789012345678901234567890123456 in config';
      expect(redactString(input)).toContain('[REDACTED_TOKEN]');
    });
  });

  describe('redactObject', () => {
    it('replaces password, secret, token, and api key properties with [REDACTED]', () => {
      const piiCredential = 'sample-credential-for-redaction';
      const secondPiiSample = 'key-redact-sample';
      const payload = {
        name: 'Normal Name',
        password: piiCredential,
        userToken: 'secret_abc',
        clientSecret: 'shhh',
        apiKey: secondPiiSample,
        details: {
          nestedSecret: 'nested',
          publicInfo: 'visible',
        },
      };

      const redacted = redactObject(payload);
      expect(redacted.name).toBe('Normal Name');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.userToken).toBe('[REDACTED]');
      expect(redacted.clientSecret).toBe('[REDACTED]');
      expect(redacted.apiKey).toBe('[REDACTED]');
      expect(redacted.details.nestedSecret).toBe('[REDACTED]');
      expect(redacted.details.publicInfo).toBe('visible');
    });

    it('sanitizes strings embedded in arrays and objects', () => {
      const payload = {
        headers: ['Bearer my_token_123', 'Content-Type: application/json'],
      };
      const redacted = redactObject(payload);
      expect(redacted.headers[0]).toBe('Bearer [REDACTED]');
      expect(redacted.headers[1]).toBe('Content-Type: application/json');
    });
  });

  describe('DataRetentionService', () => {
    const service = new DataRetentionService();

    it('correctly calculates expiration based on retention days', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      expect(service.isExpired(twoDaysAgo, 7)).toBe(false);
      expect(service.isExpired(tenDaysAgo, 7)).toBe(true);
    });

    it('allows updating retention policy per organization', () => {
      const orgId = 'test-org-123';
      const updated = service.setPolicy(orgId, { auditLogsDays: 90 });
      expect(updated.auditLogsDays).toBe(90);
      expect(updated.tempFilesDays).toBe(7); // default kept
    });
  });
});
