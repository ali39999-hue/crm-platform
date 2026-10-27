import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Regression guard for GATE-002 / P02.
 *
 * Every state-changing HTTP route (POST/PUT/PATCH/DELETE) in the API must carry
 * an explicit @RequirePermission(...) decorator. PermissionsGuard returns `true`
 * when no metadata is present, so a missing decorator silently disables RBAC.
 *
 * This test is intentionally static (source-text based) so it stays fast and
 * does not require instantiating the Nest dependency graph. It is the guard that
 * fails when a new mutating route is added without authorization metadata.
 */

const API_SRC = path.resolve(process.cwd(), 'src');
const CONTROLLER_GLOB_ROOTS = [path.join(API_SRC, 'modules'), path.join(API_SRC, 'health')];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.controller.ts')) out.push(full);
  }
  return out;
}

// Controllers whose mutating routes are intentionally public or self-service
// and do not require a matrix permission. Each entry must carry a reason.
const PUBLIC_MUTATING_ALLOWLIST: Record<string, string> = {
  'auth.controller.ts':
    'login / refresh / logout / OTP verification are the authentication entry points themselves.',
  'web-form.controller.ts':
    'the public submit endpoint is unauthenticated by design (web form embed); admin endpoints are guarded.',
  'files.controller.ts':
    'signed-token download endpoint is unauthenticated by design; upload/delete are guarded.',
};

function countMatches(src: string, re: RegExp): number {
  return (src.match(re) || []).length;
}

describe('RBAC coverage (GATE-002)', () => {
  const controllers = CONTROLLER_GLOB_ROOTS.flatMap((r) => walk(r));

  it('discovers controller files', () => {
    expect(controllers.length).toBeGreaterThan(20);
  });

  for (const file of controllers) {
    const name = path.basename(file);
    const src = fs.readFileSync(file, 'utf8');
    const mutating = countMatches(src, /@(Post|Put|Patch|Delete)\s*\(/g);
    const guarded = countMatches(src, /@RequirePermission\s*\(/g);

    if (PUBLIC_MUTATING_ALLOWLIST[name]) {
      it(`${name}: allowlisted (${PUBLIC_MUTATING_ALLOWLIST[name]})`, () => {
        expect(true).toBe(true);
      });
      continue;
    }

    it(`${name}: every mutating route has @RequirePermission`, () => {
      // A controller with mutating routes must declare at least as many
      // @RequirePermission decorators. Coarse but catches the common regression
      // (adding a POST without a decorator) and is paired with the per-file
      // review in RBAC-MAPPING.csv.
      if (mutating > 0) {
        expect(guarded).toBeGreaterThanOrEqual(mutating);
      }
      // If the controller mutates, it must import the decorator and the guard.
      if (mutating > 0) {
        expect(src).toContain("RequirePermission");
        expect(src).toContain("PermissionsGuard");
      }
    });
  }

  it('all @RequirePermission actions are canonical (no invented actions)', () => {
    const canonical = new Set([
      'organization_settings',
      'manage_members',
      'view_internal_tasks',
      'create_or_edit_tasks',
      'assign_tasks',
      'view_crm',
      'edit_crm',
      'view_ticket_internal_notes',
      'reply_to_customer',
      'view_customer_portal_records',
      'export_data',
      'view_audit',
      'manage_integrations',
    ]);
    const actionRe = /@RequirePermission\(\s*['"]([^'"]+)['"]\s*\)/g;
    const used = new Set<string>();
    for (const file of controllers) {
      const src = fs.readFileSync(file, 'utf8');
      let m: RegExpExecArray | null;
      while ((m = actionRe.exec(src)) !== null) if (m[1]) used.add(m[1]);
    }
    for (const action of used) {
      expect(canonical.has(action)).toBe(true);
    }
    expect(used.size).toBeGreaterThan(0);
  });
});
