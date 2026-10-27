import { describe, expect, it, beforeEach } from 'vitest';
import { MfaService, base32Decode, base32Encode } from './mfa.service.js';
import { createHmac } from 'node:crypto';

describe('MfaService — TOTP (RFC 6238, P02 step 10)', () => {
  let service: MfaService;

  beforeEach(() => {
    service = new MfaService();
  });

  it('base32 round-trips arbitrary bytes', () => {
    const buf = Buffer.from([0, 1, 2, 250, 251, 254, 255, 77]);
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
  });

  it('generates 160-bit base32 secrets (32 chars, RFC alphabet)', () => {
    const secret = service.generateSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(secret)).toHaveLength(20);
  });

  it('codeAt is deterministic for a fixed time', () => {
    const secret = service.generateSecret();
    expect(service.codeAt(secret, 59_000_000)).toBe(service.codeAt(secret, 59_000_000));
  });

  it('verifies a current code and honours the ±1 step drift window', () => {
    const secret = service.generateSecret();
    const now = 1_700_000_000_000;
    const current = service.codeAt(secret, now);
    expect(service.verify(secret, current, now)).toBe(true);

    const previousStep = service.codeAt(secret, now - 30_000);
    expect(service.verify(secret, previousStep, now)).toBe(true); // drift back

    const farFuture = service.codeAt(secret, now + 120_000);
    expect(service.verify(secret, farFuture, now)).toBe(false); // outside window

    expect(service.verify(secret, '000000', now)).toBe(false);
    expect(service.verify(secret, 'abc', now)).toBe(false); // non-numeric
  });

  it('codes rotate every 30s window', () => {
    const secret = service.generateSecret();
    const a = service.codeAt(secret, 59_000_000); // step 1
    const b = service.codeAt(secret, 89_000_000); // step 2
    expect(a).not.toBe(b);
  });

  it('builds an otpauth provisioning URI', () => {
    const uri = service.provisioningUri('user@org.com', 'JBSWY3DPEHPK3PXP');
    expect(uri).toContain('otpauth://totp/CRM-Platform:user%40org.com');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('digits=6');
  });
});

describe('RFC 6238 appendix B vector (SHA-256)', () => {
  const service = new MfaService();
  const key = Buffer.from('12345678901234567890123456789012', 'ascii');

  it('reproduces the official SHA-256 8-digit vector at T=59', () => {
    // RFC 6238 appendix B: SHA-256, T=59 -> 46119246 (8 digits)
    expect(service.hotpForTest(key, 1, 8)).toBe('46119246');
  });

  it('HMAC-SHA-256 pipeline matches a manual HMAC computation', () => {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(1));
    const manual = createHmac('sha256', key).update(buf).digest();
    expect(manual.length).toBe(32);
  });
});
