import { describe, expect, it } from 'vitest';
import {
  calculateAchievementPercent,
  calculateConversionSpeed,
  calculateInstallmentPlan,
  calculateInvoiceTotals,
  canConvertLead,
  formatMoney,
  generateBirthdaySmsMessage,
  generateExhibitionWelcomeSms,
  getJalaliMonthName,
  getLeadTemperatureLabel,
  getLossReasonLabel,
  gregorianToJalali,
  isBirthdayToday,
  isCheckDueSoon,
  isCustomerDormant,
  isDealRotting,
  isDuplicateCandidate,
  isIranianWeekend,
  normalizeEmail,
  normalizePhone,
  validateSayadiNumber,
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

    it('validates 16-digit Iranian Sayadi check numbers', () => {
      expect(validateSayadiNumber('1234567890123456')).toBe(true);
      expect(validateSayadiNumber('۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶')).toBe(true); // Persian numerals
      expect(validateSayadiNumber('123456')).toBe(false); // Too short
      expect(validateSayadiNumber('123456789012345a')).toBe(false); // Non-digit
    });

    it('calculates equal installment splits after down payment', () => {
      // Total 100M, down payment 20M, 4 installments of 20M each
      const plan = calculateInstallmentPlan(100000000, 20000000, 4);
      expect(plan.length).toBe(4);
      expect(plan[0]!.amountMinor).toBe(20000000);
      expect(plan.reduce((sum, it) => sum + it.amountMinor, 0)).toBe(80000000);
    });

    it('detects when a check is due soon within threshold days', () => {
      const inTwoDays = new Date(Date.now() + 86400000 * 2).toISOString();
      const inTenDays = new Date(Date.now() + 86400000 * 10).toISOString();
      expect(isCheckDueSoon(inTwoDays, 3)).toBe(true);
      expect(isCheckDueSoon(inTenDays, 3)).toBe(false);
    });

    it('calculates conversion speed and sales cycle duration', () => {
      const deals = [
        {
          createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
          wonAt: new Date().toISOString(),
          stage: 'WON',
        },
        {
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          lostAt: new Date().toISOString(),
          stage: 'LOST',
        },
      ];
      const speed = calculateConversionSpeed(deals);
      expect(speed.avgDaysToWin).toBe(10);
      expect(speed.avgDaysToLose).toBe(20);
      expect(speed.overallAvgDays).toBe(15);
    });

    it('determines if a contact birthday is today', () => {
      const fixedDate = new Date('2026-10-26T12:00:00.000Z');
      expect(isBirthdayToday('1990-10-26', fixedDate)).toBe(true);
      expect(isBirthdayToday('1995-10-26T00:00:00.000Z', fixedDate)).toBe(true);
      expect(isBirthdayToday('1990-05-15', fixedDate)).toBe(false);
      expect(isBirthdayToday(null, fixedDate)).toBe(false);
    });

    it('detects dormant customers without activity past threshold days', () => {
      const seventyDaysAgo = new Date(Date.now() - 86400000 * 70).toISOString();
      const tenDaysAgo = new Date(Date.now() - 86400000 * 10).toISOString();

      expect(isCustomerDormant(seventyDaysAgo, 60)).toBe(true);
      expect(isCustomerDormant(tenDaysAgo, 60)).toBe(false);
      expect(isCustomerDormant(null, 60)).toBe(true);
    });

    it('generates personalized Iranian transactional birthday SMS message', () => {
      const msg = generateBirthdaySmsMessage('محمد رضایی', 'فولاد گستر آریا');
      expect(msg).toContain('محمد رضایی');
      expect(msg).toContain('فولاد گستر آریا');
      expect(msg).toContain('زادروز');
    });

    it('converts Gregorian date to exact Jalali/Persian calendar date', () => {
      // 2026-10-26 is 1405/08/05 (or 1405/08/04 depending on leap year)
      const jalali = gregorianToJalali(new Date('2026-10-26T12:00:00.000Z'));
      expect(jalali.year).toBe(1405);
      expect(jalali.month).toBe(8);
      expect(jalali.day).toBeGreaterThanOrEqual(4);
      expect(jalali.formatted).toContain('1405/08/');

      // Nowruz 2026-03-21 -> Farvardin 1405
      const nowruz = gregorianToJalali(new Date('2026-03-21T12:00:00.000Z'));
      expect(nowruz.year).toBe(1405);
      expect(nowruz.month).toBe(1);
    });

    it('identifies Iranian weekend days (Friday)', () => {
      // 2026-10-30 is a Friday
      const friday = new Date('2026-10-30T12:00:00.000Z');
      expect(isIranianWeekend(friday)).toBe(true);

      // 2026-10-26 is a Monday (working day)
      const monday = new Date('2026-10-26T12:00:00.000Z');
      expect(isIranianWeekend(monday)).toBe(false);
    });

    it('returns Persian names for Jalali calendar months', () => {
      expect(getJalaliMonthName(1)).toBe('فروردین');
      expect(getJalaliMonthName(7)).toBe('مهر');
      expect(getJalaliMonthName(8)).toBe('آبان');
      expect(getJalaliMonthName(12)).toBe('اسفند');
    });

    it('translates exhibition lead temperatures to Persian labels', () => {
      expect(getLeadTemperatureLabel('HOT')).toContain('داغ');
      expect(getLeadTemperatureLabel('WARM')).toContain('گرم');
      expect(getLeadTemperatureLabel('COLD')).toContain('سرد');
    });

    it('generates personalized exhibition booth welcome SMS', () => {
      const sms = generateExhibitionWelcomeSms(
        'مهندس علوی',
        'فولاد گستر',
        'نمایشگاه صنعت تهران',
      );
      expect(sms).toContain('مهندس علوی');
      expect(sms).toContain('فولاد گستر');
      expect(sms).toContain('نمایشگاه صنعت تهران');
    });
  });
});
