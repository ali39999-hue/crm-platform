"""Validate the enterprise execution pack against its BUILD-METADATA manifest.

Usage:
  python scripts/validation/validate_pack.py [--root PATH]
  python scripts/validation/validate_pack.py --root docs/implementation
  python scripts/validation/validate_pack.py --root C:/path/to/pack

Defaults:
  --root resolves to <repo>/docs/implementation when run from the repository root.
  The pack directory (containing BUILD-METADATA.json) is auto-detected: if --root
  points at a directory that contains BUILD-METADATA.json it is used directly,
  otherwise the script searches one level below for a directory that does.

Exit code 0 on success, non-zero on any mismatch.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

EXPECTED = {
    "MASTER-EXECUTION-PLAN-10000-LINES.fa.md": {"kind": "lines", "min": 10000},
    "TASK-BACKLOG.csv": {"kind": "rows", "min": 444},
    "ROUTE-INVENTORY.csv": {"kind": "rows", "min": 120},
    "PHASES.csv": {"kind": "rows", "min": 18},
    "RELEASE-GATES.csv": {"kind": "rows", "min": 15},
}


def find_pack_root(root: Path) -> Path:
    if (root / "BUILD-METADATA.json").is_file():
        return root
    for child in root.iterdir():
        if child.is_dir() and (child / "BUILD-METADATA.json").is_file():
            return child
    raise FileNotFoundError(f"No BUILD-METADATA.json found under {root}")


def count_csv_rows(path: Path) -> int:
    with path.open("r", encoding="utf-8", newline="") as fh:
        return sum(1 for _ in fh) - 1  # subtract header


def count_lines(path: Path) -> int:
    with path.open("r", encoding="utf-8") as fh:
        return sum(1 for _ in fh)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the execution pack.")
    parser.add_argument(
        "--root",
        default=None,
        help="Directory containing (or holding) the pack. Defaults to docs/implementation under the repo root.",
    )
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parents[1]
    if args.root:
        root = Path(args.root).resolve()
    else:
        root = repo_root

    if not root.is_dir():
        print(f"[validate_pack] ERROR: root directory does not exist: {root}", file=sys.stderr)
        return 2

    # Pack mode: a directory containing BUILD-METADATA.json with all artifacts.
    if (root / "BUILD-METADATA.json").is_file():
        pack_root = root
        mode = "pack"
        file_locations = {
            "MASTER-EXECUTION-PLAN-10000-LINES.fa.md": pack_root / "MASTER-EXECUTION-PLAN-10000-LINES.fa.md",
            "TASK-BACKLOG.csv": pack_root / "TASK-BACKLOG.csv",
            "ROUTE-INVENTORY.csv": pack_root / "ROUTE-INVENTORY.csv",
            "PHASES.csv": pack_root / "PHASES.csv",
            "RELEASE-GATES.csv": pack_root / "RELEASE-GATES.csv",
        }
    else:
        # Repo mode: artifacts live in their canonical repository locations.
        mode = "repo"
        base = root
        file_locations = {
            "MASTER-EXECUTION-PLAN-10000-LINES.fa.md": base / "docs" / "implementation" / "MASTER-EXECUTION-PLAN-10000-LINES.fa.md",
            "TASK-BACKLOG.csv": base / "docs" / "implementation" / "TASK-BACKLOG.csv",
            "ROUTE-INVENTORY.csv": base / "docs" / "implementation" / "ROUTE-INVENTORY.csv",
            "PHASES.csv": base / "docs" / "implementation" / "PHASES.csv",
            "RELEASE-GATES.csv": base / "docs" / "quality" / "RELEASE-GATES.csv",
        }
    # Resolve metadata (pack mode has it at root; repo mode at docs/implementation).
    metadata_candidates = [
        file_locations["TASK-BACKLOG.csv"].parent / "BUILD-METADATA.json",
        root / "BUILD-METADATA.json",
        root / "docs" / "implementation" / "BUILD-METADATA.json",
    ]
    metadata_path = next((p for p in metadata_candidates if p.is_file()), None)
    if metadata_path is None:
        # Fall back to built-in expectations; metadata is optional in repo mode.
        metadata = {}
    else:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

    errors: list[str] = []

    # Master file line count.
    master_name = metadata.get("master_file", "MASTER-EXECUTION-PLAN-10000-LINES.fa.md")
    master_path = file_locations.get(master_name, file_locations["MASTER-EXECUTION-PLAN-10000-LINES.fa.md"])
    if not master_path.is_file():
        errors.append(f"Missing master file: {master_path}")
    else:
        actual_lines = count_lines(master_path)
        expected_lines = int(metadata.get("line_count", 10000))
        if actual_lines != expected_lines:
            errors.append(f"{master_name}: expected {expected_lines} lines, found {actual_lines}")

    # CSV row counts.
    csv_expectations = {
        "TASK-BACKLOG.csv": int(metadata.get("task_count", 444)),
        "ROUTE-INVENTORY.csv": int(metadata.get("route_count", 120)),
        "PHASES.csv": int(metadata.get("phase_count", 18)),
        "RELEASE-GATES.csv": int(metadata.get("release_gate_count", 15)),
    }
    for name, expected_rows in csv_expectations.items():
        path = file_locations[name]
        if not path.is_file():
            errors.append(f"Missing CSV: {path}")
            continue
        actual_rows = count_csv_rows(path)
        if actual_rows != expected_rows:
            errors.append(f"{name}: expected {expected_rows} data rows, found {actual_rows}")

    # CSV header sanity.
    for name in csv_expectations:
        path = file_locations[name]
        if not path.is_file():
            continue
        with path.open("r", encoding="utf-8", newline="") as fh:
            reader = csv.reader(fh)
            try:
                header = next(reader)
            except StopIteration:
                errors.append(f"{name}: empty file")
                continue
        if not header or any(not h.strip() for h in header):
            errors.append(f"{name}: invalid header")

    if errors:
        print("[validate_pack] FAILED:")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("[validate_pack] OK")
    print(f"  mode: {mode}")
    print(f"  master file lines: {count_lines(master_path)}")
    for name in csv_expectations:
        print(f"  {name} rows: {count_csv_rows(file_locations[name])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
