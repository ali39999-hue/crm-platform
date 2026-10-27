export const LEAD_STATUSES = ['NEW', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const DEAL_STAGES = [
  'QUALIFICATION',
  'NEED_ANALYSIS',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  // Strip non-digit characters except leading '+'
  const cleaned = phone.trim().replace(/[^\d+]/g, '');
  return cleaned.length > 0 ? cleaned : null;
}

export type DeduplicationCandidate = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
};

/**
 * Checks for exact match candidates based on canonical email or phone.
 */
export function isDuplicateCandidate(
  existing: DeduplicationCandidate,
  candidate: DeduplicationCandidate,
): boolean {
  const normExistEmail = normalizeEmail(existing.email);
  const normCandEmail = normalizeEmail(candidate.email);
  if (normExistEmail && normCandEmail && normExistEmail === normCandEmail) {
    return true;
  }

  const normExistPhone = normalizePhone(existing.phone);
  const normCandPhone = normalizePhone(candidate.phone);
  if (normExistPhone && normCandPhone && normExistPhone === normCandPhone) {
    return true;
  }

  return false;
}

export function canConvertLead(currentStatus: LeadStatus): boolean {
  // A lead can be converted if it is NEW or QUALIFIED, but cannot be re-converted if already CONVERTED or DISQUALIFIED
  return currentStatus === 'NEW' || currentStatus === 'QUALIFIED';
}

export function formatMoney(amountMinor: number | bigint, currency = 'IRR'): string {
  const num = typeof amountMinor === 'bigint' ? Number(amountMinor) : amountMinor;
  return `${num.toLocaleString('fa-IR')} ${currency}`;
}

export const DEAL_LOSS_REASONS = [
  'PRICE_TOO_HIGH',
  'COMPETITOR_WON',
  'FEATURE_GAP',
  'BUDGET_CANCELED',
  'CLIENT_UNRESPONSIVE',
  'OTHER',
] as const;

export type DealLossReason = (typeof DEAL_LOSS_REASONS)[number];

export function getLossReasonLabel(reason: string): string {
  switch (reason) {
    case 'PRICE_TOO_HIGH':
      return 'قیمت بالاتر از بودجه مشتری';
    case 'COMPETITOR_WON':
      return 'خرید از رقیب تجاری';
    case 'FEATURE_GAP':
      return 'کسری قابلیت یا عدم تطابق فنی';
    case 'BUDGET_CANCELED':
      return 'لغو پروژه یا کسری بودجه مشتری';
    case 'CLIENT_UNRESPONSIVE':
      return 'عدم پاسخگویی و رهاسازی پیگیری';
    case 'OTHER':
    default:
      return 'سایر دلایل';
  }
}

/**
 * Didar-inspired Deal Rotting:
 * If a deal stays in an active stage longer than the rotting threshold (default 14 days)
 * without closing or transitioning, it is marked as rotting/stagnant.
 */
export function isDealRotting(
  daysInStage: number,
  stageKey: string,
  thresholdDays = 14,
): boolean {
  if (stageKey === 'WON' || stageKey === 'LOST') {
    return false; // Closed deals never rot
  }
  return daysInStage >= thresholdDays;
}

/**
 * Calculates subtotal, discounts, tax (e.g. 10% VAT in Iran), and final total for proforma invoices
 */
export function calculateInvoiceTotals(
  items: Array<{
    quantity: number;
    unitPriceMinor: number;
    discountPercent?: number | undefined;
    taxRatePercent?: number | undefined;
  }>,
): {
  subtotalMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  finalTotalMinor: number;
} {
  let subtotalMinor = 0;
  let discountTotalMinor = 0;
  let taxTotalMinor = 0;

  for (const item of items) {
    const rawTotal = item.quantity * item.unitPriceMinor;
    subtotalMinor += rawTotal;

    const discount = item.discountPercent ? Math.round((rawTotal * item.discountPercent) / 100) : 0;
    discountTotalMinor += discount;

    const taxableAmount = rawTotal - discount;
    const taxRate = item.taxRatePercent !== undefined ? item.taxRatePercent : 10; // Default 10% VAT
    const tax = Math.round((taxableAmount * taxRate) / 100);
    taxTotalMinor += tax;
  }

  const finalTotalMinor = subtotalMinor - discountTotalMinor + taxTotalMinor;

  return {
    subtotalMinor,
    discountTotalMinor,
    taxTotalMinor,
    finalTotalMinor,
  };
}

export function calculateAchievementPercent(achieved: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((achieved / target) * 100), 999);
}

/**
 * Validates 16-digit Iranian Sayadi check numbers (شناسه صیادی چک).
 * Converts Persian/Arabic digits to Latin digits and ensures exactly 16 digits.
 */
export function validateSayadiNumber(sayadiNumber?: string | null): boolean {
  if (!sayadiNumber) return false;
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];

  let cleaned = sayadiNumber.trim();
  for (let i = 0; i <= 9; i++) {
    cleaned = cleaned.replace(persianDigits[i]!, String(i)).replace(arabicDigits[i]!, String(i));
  }

  return /^\d{16}$/.test(cleaned);
}

/**
 * Calculates equal installment splits after deducting down payment
 */
export function calculateInstallmentPlan(
  totalAmountMinor: number,
  downPaymentMinor: number,
  installmentsCount: number,
): Array<{ installmentIndex: number; amountMinor: number }> {
  if (installmentsCount <= 0) return [];
  const remainingMinor = Math.max(0, totalAmountMinor - downPaymentMinor);
  const baseAmount = Math.floor(remainingMinor / installmentsCount);
  const remainder = remainingMinor - baseAmount * installmentsCount;

  const installments: Array<{ installmentIndex: number; amountMinor: number }> = [];
  for (let i = 0; i < installmentsCount; i++) {
    // Distribute remainder to the first installments
    const amountMinor = i < remainder ? baseAmount + 1 : baseAmount;
    installments.push({
      installmentIndex: i + 1,
      amountMinor,
    });
  }
  return installments;
}

/**
 * Checks if a bank check or installment is due soon within threshold days
 */
export function isCheckDueSoon(dueDateIso: string, thresholdDays = 3): boolean {
  const due = new Date(dueDateIso).getTime();
  const now = Date.now();
  const diff = due - now;
  return diff >= 0 && diff <= thresholdDays * 86400000;
}

/**
 * Calculates Didar Conversion Speed (سرعت تبدیل):
 * Average days to close won and lost deals based on initial deal registration cohort
 */
export function calculateConversionSpeed(
  deals: Array<{
    createdAt: string;
    wonAt?: string | null;
    lostAt?: string | null;
    stage: string;
  }>,
): {
  avgDaysToWin: number;
  avgDaysToLose: number;
  overallAvgDays: number;
} {
  const wonDays: number[] = [];
  const lostDays: number[] = [];

  for (const deal of deals) {
    const createdTime = new Date(deal.createdAt).getTime();

    if (deal.stage === 'WON' && deal.wonAt) {
      const days = Math.max(
        0,
        Math.round((new Date(deal.wonAt).getTime() - createdTime) / 86400000),
      );
      wonDays.push(days);
    } else if (deal.stage === 'LOST' && deal.lostAt) {
      const days = Math.max(
        0,
        Math.round((new Date(deal.lostAt).getTime() - createdTime) / 86400000),
      );
      lostDays.push(days);
    }
  }

  const avgDaysToWin =
    wonDays.length > 0 ? Math.round(wonDays.reduce((a, b) => a + b, 0) / wonDays.length) : 0;
  const avgDaysToLose =
    lostDays.length > 0 ? Math.round(lostDays.reduce((a, b) => a + b, 0) / lostDays.length) : 0;

  const allClosed = [...wonDays, ...lostDays];
  const overallAvgDays =
    allClosed.length > 0
      ? Math.round(allClosed.reduce((a, b) => a + b, 0) / allClosed.length)
      : 0;

  return {
    avgDaysToWin,
    avgDaysToLose,
    overallAvgDays,
  };
}

/**
 * Checks if a contact's birthday is today (comparing month and day)
 */
export function isBirthdayToday(birthDateIso?: string | null, today = new Date()): boolean {
  if (!birthDateIso) return false;
  const bDate = new Date(birthDateIso);
  if (isNaN(bDate.getTime())) return false;
  return bDate.getUTCMonth() === today.getUTCMonth() && bDate.getUTCDate() === today.getUTCDate();
}

/**
 * Checks if a customer is dormant (no interactions past threshold days, default 60 days)
 */
export function isCustomerDormant(
  lastInteractionIso?: string | null,
  thresholdDays = 60,
): boolean {
  if (!lastInteractionIso) return true;
  const lastTime = new Date(lastInteractionIso).getTime();
  if (isNaN(lastTime)) return true;
  const diff = Date.now() - lastTime;
  return diff >= thresholdDays * 86400000;
}

/**
 * Generates personalized Iranian transactional birthday SMS message
 */
export function generateBirthdaySmsMessage(contactName: string, companyName: string): string {
  return `مشتری گرامی جناب/سرکار ${contactName}، زادروزتان خجسته باد. با آرزوی تندرستی و شادکامی، از طرف تیم ${companyName}.`;
}

/**
 * Converts a Gregorian Date to Jalali/Persian calendar components and formatted string
 */
export function gregorianToJalali(date: Date): {
  year: number;
  month: number;
  day: number;
  formatted: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1400', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
  const day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);

  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  return {
    year,
    month,
    day,
    formatted: `${year}/${mStr}/${dStr}`,
  };
}

/**
 * Identifies Iranian weekend days (Friday)
 */
export function isIranianWeekend(date: Date): boolean {
  return date.getUTCDay() === 5;
}

const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * Returns Persian localized name for a Jalali month number (1 to 12)
 */
export function getJalaliMonthName(monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) return '';
  return JALALI_MONTH_NAMES[monthNumber - 1] || '';
}

/**
 * Translates exhibition lead temperature to Persian descriptive label
 */
export function getLeadTemperatureLabel(temperature: string): string {
  switch (temperature) {
    case 'HOT':
      return '🔥 داغ (خرید فوری / نیازمند اقدام امروز)';
    case 'WARM':
      return '🌤️ گرم (علاقه‌مند / پیگیری در این هفته)';
    case 'COLD':
    default:
      return '❄️ سرد (معمولی / دریافت بروشور و کاتالوگ)';
  }
}

/**
 * Generates automated exhibition booth welcome and thanks SMS
 */
export function generateExhibitionWelcomeSms(
  visitorName: string,
  companyName: string,
  exhibitionName: string,
): string {
  return `جناب/سرکار ${visitorName} گرامی، از حضور ارزشمند شما در غرفه ${companyName} در ${exhibitionName} سپاسگزاریم. کاتالوگ و پروپوزال تکمیلی به زودی برای شما ارسال خواهد شد.`;
}

