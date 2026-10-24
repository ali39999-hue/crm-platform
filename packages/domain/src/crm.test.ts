import { describe, expect, it } from 'vitest';
import {
  canConvertLead,
  formatMoney,
  isDuplicateCandidate,
  normalizeEmail,
  normalizePhone,
} from './crm.js';

describe('CRM domain business rules', () => {
  it('normalizes email addresses to lowercase and trims whitespace', () => {
    expect(normalizeEmail('  User.Test@Company.Com ')).toBe('user.test@company.com');
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it('normalizes phone numbers to digits and leading + sign', () => {
    expect(normalizePhone(' +98 (912) 345-6789 ')).toBe('+989123456789');
    expect(normalizePhone(' 021-88776655 ')).toBe('02188776655');
    expect(normalizePhone(null)).toBeNull();
  });

  it('detects duplicate candidates based on exact normalized email or phone', () => {
    expect(
      isDuplicateCandidate(
        { email: 'ali@company.com', phone: '09121112233' },
        { email: ' ALI@COMPANY.COM ', phone: '09350000000' },
      ),
    ).toBe(true);

    expect(
      isDuplicateCandidate(
        { email: 'reza@company.com', phone: '0912-111-2233' },
        { email: 'other@company.com', phone: '09121112233' },
      ),
    ).toBe(true);

    expect(
      isDuplicateCandidate(
        { email: 'first@company.com', phone: '09121112233' },
        { email: 'second@company.com', phone: '09129998877' },
      ),
    ).toBe(false);
  });

  it('determines if a lead can be converted', () => {
    expect(canConvertLead('NEW')).toBe(true);
    expect(canConvertLead('QUALIFIED')).toBe(true);
    expect(canConvertLead('CONVERTED')).toBe(false);
    expect(canConvertLead('DISQUALIFIED')).toBe(false);
  });

  it('formats monetary amounts with currency', () => {
    const formatted = formatMoney(500000000, 'IRR');
    expect(formatted).toContain('IRR');
  });
});
