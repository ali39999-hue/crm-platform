/**
 * PII and Secret Redactor (F4-06)
 * Redacts sensitive fields, secrets, credentials, and personal identifiable information
 * from logs, audit events, and public error payloads.
 */

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /secret/i,
  /token/i,
  /auth(orization)?/i,
  /api[_-]?key/i,
  /credit[_-]?card/i,
  /card[_-]?number/i,
  /cvv/i,
  /ssn/i,
  /national[_-]?id/i,
  /sheba/i,
  /iban/i,
];

const CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9_\-\.]+/gi;
const GITHUB_TOKEN_REGEX = /gh[opusr]_[A-Za-z0-9_]{30,255}/g;

/**
 * Mask an email address: user@example.com -> u***r@example.com
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '[REDACTED_EMAIL]';
  const [local, domain] = parts;
  if (!local || !domain) return '[REDACTED_EMAIL]';
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Mask a phone number: 09123456789 -> 0912****789
 */
export function maskPhone(phone: string): string {
  const clean = phone.trim();
  if (clean.length < 7) return '[REDACTED_PHONE]';
  return `${clean.slice(0, 4)}****${clean.slice(-3)}`;
}

/**
 * Redacts raw string for known patterns like cards, bearer tokens, and API keys
 */
export function redactString(str: string): string {
  return str
    .replace(BEARER_REGEX, 'Bearer [REDACTED]')
    .replace(GITHUB_TOKEN_REGEX, '[REDACTED_TOKEN]')
    .replace(CARD_REGEX, '[REDACTED_CARD]');
}

/**
 * Recursively deep-redact sensitive keys and values in an object or array.
 */
export function redactObject<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return redactString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

      if (isSensitiveKey) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redactObject(value);
      } else if (typeof value === 'string') {
        result[key] = redactString(value);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  return obj;
}
