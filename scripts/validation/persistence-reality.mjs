#!/usr/bin/env node
/**
 * Persistence reality check (GATE-003 / GATE-015 helper).
 *
 * Reads the real NestJS provider wiring instead of trusting documentation and
 * reports, per repository token, whether the production path (`USE_DATABASE=true`)
 * resolves to a durable database implementation or to an in-memory one.
 *
 * Usage:
 *   node scripts/validation/persistence-reality.mjs            # report only, exit 0
 *   node scripts/validation/persistence-reality.mjs --strict   # exit 1 if any prod path is in-memory
 *   node scripts/validation/persistence-reality.mjs --json     # machine-readable output
 *
 * This script performs static analysis only. It does not connect to a database
 * and does not prove that the Prisma repositories are correct; it only proves
 * which class the application would instantiate for each token.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const appModulePath = resolve(repoRoot, 'apps/api/src/app.module.ts');
const matrixPath = resolve(repoRoot, 'docs/audits/2026-10-27/provider-persistence-matrix.csv');

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const asJson = args.has('--json');

if (!existsSync(appModulePath)) {
  console.error(`[persistence-reality] app.module.ts not found at ${appModulePath}`);
  process.exit(2);
}

const source = readFileSync(appModulePath, 'utf8');

/** Extract provider blocks of the shape { provide: 'TOKEN', useClass: A ? B : C } */
function extractProviderBlocks(text) {
  const blocks = [];
  const providerRe = /\{\s*provide:\s*'([^']+)'\s*,\s*useClass:\s*([^,}]+?)\s*,?\s*\}/g;
  let match;
  while ((match = providerRe.exec(text)) !== null) {
    blocks.push({ token: match[1], expression: match[2].trim(), index: match.index });
  }
  return blocks;
}

function classify(expression) {
  const classes = [...expression.matchAll(/([A-Z][A-Za-z0-9_]*)/g)].map((m) => m[1]);
  const durable = classes.filter((name) => /^(Prisma|Db|Database|Sql)/.test(name));
  const ephemeral = classes.filter((name) => /^InMemory/.test(name));
  if (durable.length > 0) return { kind: 'database', classes };
  if (ephemeral.length > 0) return { kind: 'in-memory', classes };
  return { kind: 'unknown', classes };
}

const providers = extractProviderBlocks(source).map((block) => ({
  ...block,
  ...classify(block.expression),
}));

/** Services that inject a concrete InMemory class instead of a token. */
const services = [...source.matchAll(/^\s*(?!\/\/)([A-Z][A-Za-z0-9_]*Service),?$/gm)].map((m) => m[1]);
const concreteInMemoryProviders = [...source.matchAll(/^\s*(InMemory[A-Za-z0-9_]+),?$/gm)].map((m) => m[1]);
const concretePrismaProviders = [...source.matchAll(/^\s*(Prisma[A-Za-z0-9_]+),?$/gm)].map((m) => m[1]);

const byToken = providers.filter((p) => /_REPOSITORY$/.test(p.token));
const inMemoryTokens = byToken.filter((p) => p.kind === 'in-memory');
const databaseTokens = byToken.filter((p) => p.kind === 'database');

/** Compare with the historical audit matrix (documented claims). */
let matrixRows = [];
if (existsSync(matrixPath)) {
  const csv = readFileSync(matrixPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const header = csv[0].split(',');
  matrixRows = csv.slice(1).map((line) => {
    const cells = [];
    let current = '';
    let quoted = false;
    for (const char of line) {
      if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) {
        cells.push(current);
        current = '';
      } else current += char;
    }
    cells.push(current);
    return Object.fromEntries(header.map((h, i) => [h.trim(), (cells[i] ?? '').trim()]));
  });
}
const claimedVerified = matrixRows.filter((row) =>
  /VERIFIED/i.test(row.ReadinessGateStatus ?? '') ||
  /PostgreSQL|Prisma/i.test(row.ProductionImplementation ?? ''),
);

const report = {
  generatedAt: new Date().toISOString(),
  appModule: 'apps/api/src/app.module.ts',
  tokens: {
    total: byToken.length,
    database: databaseTokens.map((p) => ({ token: p.token, expression: p.expression })),
    inMemory: inMemoryTokens.map((p) => ({ token: p.token, expression: p.expression })),
  },
  concreteProviders: {
    inMemoryRegistered: [...new Set(concreteInMemoryProviders)],
    prismaRegistered: [...new Set(concretePrismaProviders)],
    serviceCount: services.length,
  },
  documentation: {
    matrixPath: existsSync(matrixPath) ? 'docs/audits/2026-10-27/provider-persistence-matrix.csv' : null,
    matrixRows: matrixRows.length,
    rowsClaimingVerified: claimedVerified.length,
    rowsClaimingVerifiedDomains: claimedVerified.map((r) => r.Domain),
  },
  verdict:
    byToken.length === 0
      ? 'UNKNOWN_NO_REPOSITORY_TOKENS_FOUND'
      : inMemoryTokens.length === 0
        ? 'PRODUCTION_PATH_DATABASE_ONLY'
        : 'PRODUCTION_PATH_HAS_IN_MEMORY_REPOSITORIES',
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('# Persistence reality check');
  console.log(`Generated: ${report.generatedAt}`);
  console.log(`Tokens wired: ${report.tokens.total} | database: ${databaseTokens.length} | in-memory: ${inMemoryTokens.length}`);
  console.log('');
  console.log('| Token | Production path | Verdict |');
  console.log('|---|---|---|');
  for (const p of byToken) {
    console.log(`| \`${p.token}\` | \`${p.expression.replace(/\|/g, '\\|')}\` | ${p.kind} |`);
  }
  console.log('');
  console.log(`Concrete InMemory classes registered (dev/test + prod fallback): ${report.concreteProviders.inMemoryRegistered.length}`);
  console.log(`Concrete Prisma classes registered: ${report.concreteProviders.prismaRegistered.length}`);
  if (report.concreteProviders.inMemoryRegistered.length > 0) {
    console.log('  Directly injected InMemory providers (no database path exists for these domains):');
    for (const name of report.concreteProviders.inMemoryRegistered) {
      console.log(`   - ${name}`);
    }
  }
  console.log(
    `Documentation matrix rows claiming PostgreSQL/VERIFIED: ${claimedVerified.length}/${matrixRows.length}`,
  );
  if (claimedVerified.length > 0) {
    console.log(`  Domains claimed verified: ${claimedVerified.map((r) => r.Domain).join(', ')}`);
  }
  console.log('');
  console.log(`Verdict: ${report.verdict}`);
  if (inMemoryTokens.length > 0) {
    console.log(
      '\nBLOCKER (GATE-003): these tokens fall back to InMemory when USE_DATABASE is not "true". ' +
        'Production startup must fail closed until each one has a durable implementation.',
    );
  }
}

if (strict && inMemoryTokens.length > 0) {
  console.error('\n[persistence-reality] --strict: production path still has in-memory repositories.');
  process.exit(1);
}
