import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';

/**
 * TOTP (RFC 6238) — pure Node crypto, no external dependency (AGENTS.md rule:
 * new tools need documented need; HMAC-SHA1 from node:crypto suffices).
 *
 * On HMAC-SHA-256: RFC 6238 names SHA-256 alongside SHA-1; this
 * implementation uses SHA-256 (per workspace security policy forbidding new
 * SHA-1 usage) with 6-digit/30s codes. Authenticator apps must support the
 * SHA-256 variant (Aegis, 2FAS, 1Password, Bitwarden do; flag it in the
 * provisioning flow for Google-Authenticator-only users).
 *
 * Flow (P02 / CRM-AUTH): setup returns a base32 secret + otpauth URI; enable
 * verifies one live code and flips mfaEnabled; login then requires a valid
 * code from the authenticator.
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of input.toUpperCase().replace(/=+$/, '')) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

@Injectable()
export class MfaService {
  /** 160-bit secret, base32 (authenticator-app friendly). */
  generateSecret(): string {
    return base32Encode(randomBytes(20));
  }

  provisioningUri(email: string, secret: string, issuer = 'CRM-Platform'): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA256&digits=6&period=30`;
  }

  /** 6-digit TOTP at `timeMs` (defaults to now). */
  codeAt(secret: string, timeMs: number = Date.now()): string {
    const step = Math.floor(timeMs / 30_000);
    return this.hotp(base32Decode(secret), step);
  }

  private hotp(key: Buffer, counter: number, digits = 6): string {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const hmac = createHmac('sha256', key).update(buf).digest();
    const offset = hmac[hmac.length - 1]! & 0x0f;
    const binary =
      ((hmac[offset]! & 0x7f) << 24) |
      ((hmac[offset + 1]! & 0xff) << 16) |
      ((hmac[offset + 2]! & 0xff) << 8) |
      (hmac[offset + 3]! & 0xff);
    return String(binary % 10 ** digits).padStart(digits, '0');
  }

  /** Exposed for RFC-vector tests (RFC 6238 appendix B, SHA-256). */
  hotpForTest(key: Buffer, counter: number, digits = 6): string {
    return this.hotp(key, counter, digits);
  }

  /**
   * Constant-time-ish verification with a ±1 step window (clock drift).
   * Returns true only for a code matching a neighbouring 30s window.
   */
  verify(secret: string, code: string, timeMs: number = Date.now(), window = 1): boolean {
    if (!/^\d{6}$/.test(code)) return false;
    for (let drift = -window; drift <= window; drift++) {
      const candidate = this.codeAt(secret, timeMs + drift * 30_000);
      if (candidate === code) return true;
    }
    return false;
  }
}
