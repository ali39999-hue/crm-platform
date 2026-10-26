import { describe, expect, it } from 'vitest';
import {
  calculateAchievementPercent,
  calculateInvoiceTotals,
  canConvertLead,
  formatMoney,
  getLossReasonLabel,
  isDealRotting,
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

  describe('Didar CRM-inspired Domain Rules', () => {
    it('detects rotting/stagnant deals based on days in stage', () => {
      // Stage ACTIVE past threshold (14 days)
      expect(isDealRotting(15, 'PROPOSAL', 14)).toBe(true);
      expect(isDealRotting(10, 'PROPOSAL', 14)).toBe(false);

      // WON or LOST deals never rot
      expect(isDealRotting(30, 'WON', 14)).toBe(false);
      expect(isDealRotting(30, 'LOST', 14)).toBe(false);
    });

    it('calculates invoice totals with discounts and 10% VAT tax', () => {
      const items = [
        {
          quantity: 2,
          unitPriceMinor: 1000000, // 2,000,000
          discountPercent: 10, // 200,000 discount -> 1,800,000 taxable -> 180,000 VAT -> 1,980,000
          taxRatePercent: 10,
        },
      ];

      const totals = calculateInvoiceTotals(items);
      expect(totals.subtotalMinor).toBe(2000000);
      expect(totals.discountTotalMinor).toBe(200000);
      expect(totals.taxTotalMinor).toBe(180000);
      expect(totals.finalTotalMinor).toBe(1980000);
    });

    it('translates deal loss reasons into Persian labels', () => {
      expect(getLossReasonLabel('PRICE_TOO_HIGH')).toContain('قیمت بالاتر');
      expect(getLossReasonLabel('COMPETITOR_WON')).toContain('رقیب');
    });

    it('calculates sales target achievement percentage', () => {
      expect(calculateAchievementPercent(75000000, 100000000)).toBe(75);
      expect(calculateAchievementPercent(0, 100000000)).toBe(0);
    });
  });
});
