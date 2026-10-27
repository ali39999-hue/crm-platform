import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Static DI-coverage guard (GATE-005).
 *
 * Nest only instantiates what `providers` registers; `exports` merely
 * re-publishes. AppModule previously listed services and repository tokens in
 * `exports` only, so the module compiled cleanly but crashed at bootstrap the
 * moment a controller was resolved — invisible to every test that never
 * compiles the module. This test locks the invariant: everything exported
 * must be registered.
 */

const MODULE_FILE = path.resolve(process.cwd(), 'src', 'app.module.ts');

function extractBlock(src: string, name: string): string {
  const marker = `  ${name}: [`;
  const start = src.indexOf(marker);
  if (start === -1) return '';
  const bodyStart = src.indexOf('[', start) + 1;
  let depth = 1;
  let i = bodyStart;
  while (depth > 0 && i < src.length) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') depth--;
    i++;
  }
  return src.slice(bodyStart, i - 1);
}

function entries(block: string): Set<string> {
  const found = new Set<string>();
  for (const m of block.matchAll(/provide:\s*'([^']+)'/g)) {
    found.add(`token:${m[1]}`);
  }
  for (const line of block.split('\n')) {
    const t = line.trim().replace(/,$/, '');
    if (/^[A-Z][A-Za-z0-9_]*$/.test(t)) {
      found.add(`class:${t}`);
    }
  }
  return found;
}

describe('AppModule DI coverage (GATE-005)', () => {
  const src = fs.readFileSync(MODULE_FILE, 'utf8');
  const providers = entries(extractBlock(src, 'providers'));
  const exportsBlock = entries(extractBlock(src, 'exports'));

  it('parses both blocks non-trivially', () => {
    expect(providers.size).toBeGreaterThan(30);
    expect(exportsBlock.size).toBeGreaterThan(10);
  });

  it('registers every exported class and token in providers', () => {
    const missing = [...exportsBlock].filter((entry) => !providers.has(entry));
    expect(missing, `exported but never registered in providers: ${missing.join(', ')}`).toEqual([]);
  });

  it('registers the conditional repository tokens', () => {
    for (const token of ['TASK_REPOSITORY', 'CRM_REPOSITORY', 'SUPPORT_REPOSITORY', 'PROJECT_REPOSITORY', 'TIME_TRACKING_REPOSITORY']) {
      expect(providers.has(`token:${token}`), token).toBe(true);
    }
  });
});
