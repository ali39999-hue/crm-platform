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
