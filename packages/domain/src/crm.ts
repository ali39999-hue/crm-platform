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

