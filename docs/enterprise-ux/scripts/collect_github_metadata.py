#!/usr/bin/env python3
"""Plan the collection of public GitHub repository metadata.

The script performs NO network I/O: per workspace SSRF policy it only emits, per
allowlisted reference repository, the exact curl command to run manually. No
repository code is cloned, downloaded, or executed. Metadata and API license
identifiers are for triage only; they are not a legal determination.
"""
from __future__ import annotations
import argparse
import csv
import json
import re
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

GITHUB_API_BASE = "https://api.github.com"
GITHUB_WEB_BASE = "https://github.com"

KNOWN_REPO_URLS: dict[str, str] = {
    "Leantime/leantime": "https://api.github.com/repos/Leantime/leantime",
    "TanStack/query": "https://api.github.com/repos/TanStack/query",
    "TanStack/table": "https://api.github.com/repos/TanStack/table",
    "calcom/cal.com": "https://api.github.com/repos/calcom/cal.com",
    "callstack/react-native-paper": "https://api.github.com/repos/callstack/react-native-paper",
    "casbin/casbin": "https://api.github.com/repos/casbin/casbin",
    "cerbos/cerbos": "https://api.github.com/repos/cerbos/cerbos",
    "chatwoot/chatwoot": "https://api.github.com/repos/chatwoot/chatwoot",
    "clauderic/dnd-kit": "https://api.github.com/repos/clauderic/dnd-kit",
    "colinhacks/zod": "https://api.github.com/repos/colinhacks/zod",
    "espocrm/espocrm": "https://api.github.com/repos/espocrm/espocrm",
    "expo/expo": "https://api.github.com/repos/expo/expo",
    "formbricks/formbricks": "https://api.github.com/repos/formbricks/formbricks",
    "frappe/crm": "https://api.github.com/repos/frappe/crm",
    "frappe/erpnext": "https://api.github.com/repos/frappe/erpnext",
    "fullcalendar/fullcalendar": "https://api.github.com/repos/fullcalendar/fullcalendar",
    "getsentry/sentry": "https://api.github.com/repos/getsentry/sentry",
    "go-vikunja/vikunja": "https://api.github.com/repos/go-vikunja/vikunja",
    "grafana/grafana": "https://api.github.com/repos/grafana/grafana",
    "keycloak/keycloak": "https://api.github.com/repos/keycloak/keycloak",
    "makeplane/plane": "https://api.github.com/repos/makeplane/plane",
    "microsoft/playwright": "https://api.github.com/repos/microsoft/playwright",
    "mrousavy/react-native-mmkv": "https://api.github.com/repos/mrousavy/react-native-mmkv",
    "mswjs/msw": "https://api.github.com/repos/mswjs/msw",
    "n8n-io/n8n": "https://api.github.com/repos/n8n-io/n8n",
    "nestjs/nest": "https://api.github.com/repos/nestjs/nest",
    "open-telemetry/opentelemetry-js": "https://api.github.com/repos/open-telemetry/opentelemetry-js",
    "openfga/openfga": "https://api.github.com/repos/openfga/openfga",
    "opf/openproject": "https://api.github.com/repos/opf/openproject",
    "orval-labs/orval": "https://api.github.com/repos/orval-labs/orval",
    "pmndrs/zustand": "https://api.github.com/repos/pmndrs/zustand",
    "pnpm/pnpm": "https://api.github.com/repos/pnpm/pnpm",
    "postgres/postgres": "https://api.github.com/repos/postgres/postgres",
    "prisma/prisma": "https://api.github.com/repos/prisma/prisma",
    "radix-ui/primitives": "https://api.github.com/repos/radix-ui/primitives",
    "react-hook-form/react-hook-form": "https://api.github.com/repos/react-hook-form/react-hook-form",
    "redis/redis": "https://api.github.com/repos/redis/redis",
    "shadcn-ui/ui": "https://api.github.com/repos/shadcn-ui/ui",
    "socketio/socket.io": "https://api.github.com/repos/socketio/socket.io",
    "software-mansion/react-native-gesture-handler": "https://api.github.com/repos/software-mansion/react-native-gesture-handler",
    "software-mansion/react-native-reanimated": "https://api.github.com/repos/software-mansion/react-native-reanimated",
    "storybookjs/storybook": "https://api.github.com/repos/storybookjs/storybook",
    "taigaio/taiga": "https://api.github.com/repos/taigaio/taiga",
    "taskforcesh/bullmq": "https://api.github.com/repos/taskforcesh/bullmq",
    "temporalio/temporal": "https://api.github.com/repos/temporalio/temporal",
    "testing-library/react-testing-library": "https://api.github.com/repos/testing-library/react-testing-library",
    "twentyhq/twenty": "https://api.github.com/repos/twentyhq/twenty",
    "vercel/next.js": "https://api.github.com/repos/vercel/next.js",
    "vercel/turborepo": "https://api.github.com/repos/vercel/turborepo",
    "vitest-dev/vitest": "https://api.github.com/repos/vitest-dev/vitest",
}

FIELDS = [


    "repository", "url", "description", "visibility", "default_branch", "curl_command",
    "created_at", "updated_at", "pushed_at", "stars", "forks", "open_issues",
    "archived", "is_template", "language", "license_spdx_id", "license_name",
    "topics", "collected_at_utc", "api_status", "error",
]





def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input", required=True, type=Path, help="Reference CSV with repository column owner/name")
    p.add_argument("--out-dir", required=True, type=Path)
    p.add_argument("--delay-seconds", type=float, default=1.2)
    p.add_argument("--limit", type=int, default=0, help="Optional cap for a test run; 0 = all rows")
    p.add_argument("--timeout", type=float, default=20.0)
    return p.parse_args()

def main() -> int:
    args = parse_args()
    if not args.input.is_file():
        print(f"Input CSV not found: {args.input}", file=sys.stderr)
        return 2
    if args.delay_seconds < 0 or args.timeout <= 0:
        print("delay must be >= 0 and timeout must be > 0", file=sys.stderr)
        return 2
    token = os.getenv("GITHUB_TOKEN", "").strip()
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "crm-platform-public-research-metadata/1.0", "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    with args.input.open("r", newline="", encoding="utf-8-sig") as f:
        src_rows = list(csv.DictReader(f))
    seen: set[str] = set()
    repos: list[str] = []
    for row in src_rows:
        repo = (row.get("repository") or "").strip().strip("/")
        if repo and repo.count("/") == 1 and repo not in seen:
            seen.add(repo)
            repos.append(repo)
    if args.limit > 0:
        repos = repos[:args.limit]
    if not repos:
        print("No valid owner/repo values found in the repository column", file=sys.stderr)
        return 2
    args.out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for index, repo in enumerate(repos, 1):
        now = datetime.now(timezone.utc).isoformat()
        rec = {key: "" for key in FIELDS}
        api_url = KNOWN_REPO_URLS.get(repo)
        if api_url is None:
            rec["api_status"] = "SKIPPED_NOT_IN_ALLOWLIST"
            rec["error"] = "repository is not in the static allowlist; extend KNOWN_REPO_URLS deliberately"
            results.append(rec)
            continue
        rec.update({
            "repository": repo,
            "url": "https://github.com/" + repo,
            "collected_at_utc": now,
            "api_status": "PLANNED_MANUAL_FETCH",
            "curl_command": 'curl -sS -H "Accept: application/vnd.github+json" ' + api_url,
        })
        results.append(rec)
        print(f"[{index}/{len(repos)}] {repo}: {rec['api_status']}" + (f" — {rec['error']}" if rec["error"] else ""))
        if index < len(repos) and args.delay_seconds:
            time.sleep(args.delay_seconds)
    json_path = args.out_dir / "github-repository-metadata.json"
    csv_path = args.out_dir / "github-repository-metadata.csv"
    json_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(results)
    failures = [r for r in results if r["api_status"] != "OK"]
    if failures:
        with (args.out_dir / "collection-errors.csv").open("w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=FIELDS)
            writer.writeheader()
            writer.writerows(failures)
    print(f"Wrote {len(results)} rows: {csv_path} and {json_path}; failures={len(failures)}")
    return 0 if not failures else 1

if __name__ == "__main__":
    raise SystemExit(main())
