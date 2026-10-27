import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

describe('Security & License Audit Scanner (AUDIT-2026-002 & AUDIT-2026-003)', () => {
  it('detects unmitigated hardcoded secrets as BLOCKER in production files', async () => {
    const scriptPath = path.resolve(process.cwd(), '../../scripts/security-audit.js');
    const { scanDirForSecrets } = await import(pathToFileURL(scriptPath).href);

    const tempTestDir = path.join(process.cwd(), 'src/common/security/__temp_sec_test__');
    if (!fs.existsSync(tempTestDir)) fs.mkdirSync(tempTestDir, { recursive: true });

    const fakeSecretFile = path.join(tempTestDir, 'leaked_service.ts');
    fs.writeFileSync(
      fakeSecretFile,
      `export const awsKey = "AKIA${'IOSFODNN7EXAMPLE'}"; // Hardcoded AWS Key\n`,
    );

    try {
      const findings = scanDirForSecrets(tempTestDir);
      const blocker = findings.find((f: any) => f.severity === 'BLOCKER');

      expect(blocker).toBeDefined();
      expect(blocker?.type).toBe('HARDCODED_SECRET_BLOCKER');
    } finally {
      if (fs.existsSync(fakeSecretFile)) fs.unlinkSync(fakeSecretFile);
      if (fs.existsSync(tempTestDir)) fs.rmdirSync(tempTestDir);
    }
  });

  it('scans third-party dependencies against approved open source allowlist', async () => {
    const scriptPath = path.resolve(process.cwd(), '../../scripts/security-audit.js');
    const { verifyThirdPartyLicenses } = await import(pathToFileURL(scriptPath).href);

    const { internalPackages, licenseFindings } = verifyThirdPartyLicenses();
    expect(internalPackages.length).toBeGreaterThanOrEqual(6);
    expect(licenseFindings.length).toBe(0); // Zero forbidden copyleft licenses
  });

  it('passes all gates when no blocking secrets or license violations exist', async () => {
    const scriptPath = path.resolve(process.cwd(), '../../scripts/security-audit.js');
    const { runSecurityAudit } = await import(pathToFileURL(scriptPath).href);

    const result = runSecurityAudit({ exitOnError: false });
    expect(result.success).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });
});
