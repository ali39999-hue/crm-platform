#!/usr/bin/env python3
"""Collect public GitHub repository metadata through the official REST API.

No repository code is cloned, downloaded, or executed. Metadata and API license
identifiers are for triage only; they are not a legal determination.
"""
from __future__ import annotations
import argparse
import csv
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

FIELDS = [
    "repository", "url", "description", "visibility", "default_branch",
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
        rec.update({"repository": repo, "url": f"https://github.com/{repo}", "collected_at_utc": now, "api_status": "ERROR"})
        request = Request(f"https://api.github.com/repos/{repo}", headers=headers, method="GET")
        try:
            with urlopen(request, timeout=args.timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
            lic = payload.get("license") or {}
            rec.update({
                "description": payload.get("description") or "",
                "visibility": payload.get("visibility") or ("public" if payload.get("private") is False else "unknown"),
                "default_branch": payload.get("default_branch") or "",
                "created_at": payload.get("created_at") or "",
                "updated_at": payload.get("updated_at") or "",
                "pushed_at": payload.get("pushed_at") or "",
                "stars": payload.get("stargazers_count", ""),
                "forks": payload.get("forks_count", ""),
                "open_issues": payload.get("open_issues_count", ""),
                "archived": payload.get("archived", ""),
                "is_template": payload.get("is_template", ""),
                "language": payload.get("language") or "",
                "license_spdx_id": lic.get("spdx_id") or "",
                "license_name": lic.get("name") or "",
                "topics": ";".join(payload.get("topics") or []),
                "api_status": "OK",
            })
        except HTTPError as exc:
            rec["error"] = f"HTTP {exc.code}: {exc.reason}"
            if exc.code == 403:
                rec["error"] += " (check rate limit/token; do not bypass limits)"
        except (URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            rec["error"] = f"{type(exc).__name__}: {exc}"
        except Exception as exc:  # preserve the failed row rather than lose the batch
            rec["error"] = f"Unexpected {type(exc).__name__}: {exc}"
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
