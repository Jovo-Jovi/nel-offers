"""Verify and land the reviewer bundle for NELO (T01).

Reviewer-authored tooling, landed byte-exact with the bundle. Python 3.10+, standard library only.
It serves the T01 landing only. Once T01 is merged, `docs/method/T01_BUNDLE.sha256` is a record
of what landed; later tasks change ledgers and documents by their own fences, not by this script.

Run it from the repository root. Paths may be written with `/` or `\\`.

Subcommands
-----------
allocate  --ledger PATH --prefix PR|CF --base N
    Replace every `<prefix>-__` placeholder in a fresh ledger, in file order: each table row id
    becomes base+1, base+2, ... and the "Next free id" line becomes the next number.
    `--base` is the live maximum id, computed by the landing task. A ledger that already has a
    numbered id is refused: this runs once, at landing.

verify    --manifest PATH (--ref REF | --worktree) [--base-pr N] [--base-cf N] [--append-only PATH ...]
    Check every manifest entry. With --ref, bytes come from `git show REF:PATH` through
    subprocess (no shell). Ledger files are compared after their allocated ids are folded back
    to `<prefix>-__`, and their allocation is checked: consecutive ids from base+1, and a
    "Next free id" equal to the last id plus one. In the working tree a ledger may also be
    wholly unallocated (every id still `<prefix>-__`); a partly allocated ledger always fails,
    and at a ref an unallocated ledger fails. A path given to --append-only passes when its
    first <bytes> bytes match the manifest (an entry appended after the bundle).

Manifest line format:  <sha256>  <byte length>  <path>
Exit code 0 only when every check passes; 2 when not run from the repository root.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import subprocess
import sys
from pathlib import Path

LEDGERS = {
    "docs/method/PRECEDENTS.md": "PR",
    "docs/method/CARRY_FORWARDS.md": "CF",
}


def norm(path: str) -> str:
    path = path.replace("\\", "/")
    while path.startswith("./"):
        path = path[2:]
    return path


def at_repo_root() -> bool:
    done = subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True)
    if done.returncode != 0:
        return False
    top = done.stdout.decode("utf-8", errors="replace").strip()
    return os.path.normcase(os.path.realpath(top)) == os.path.normcase(os.path.realpath(os.getcwd()))


def read_bytes(path: str, ref: str | None) -> bytes:
    if ref is None:
        return Path(path).read_bytes()
    done = subprocess.run(["git", "show", f"{ref}:{path}"], capture_output=True)
    if done.returncode != 0:
        raise FileNotFoundError(f"git show {ref}:{path} failed: {done.stderr.decode(errors='replace').strip()}")
    return done.stdout


def fold_ids(data: bytes, prefix: str) -> bytes:
    text = data.decode("utf-8")
    return re.sub(rf"\b{prefix}-\d{{2,}}\b", f"{prefix}-__", text).encode("utf-8")


def check_allocation(data: bytes, prefix: str, base: int) -> tuple[str, str]:
    """Return (state, detail); state is 'allocated', 'unallocated' or 'invalid'."""
    text = data.decode("utf-8")
    pending_rows = re.findall(rf"^\| {prefix}-__ \|", text, flags=re.MULTILINE)
    pending_next = re.findall(rf"\*\*Next free id: {prefix}-__\*\*", text)
    row_ids = re.findall(rf"^\| {prefix}-(\d{{2,}}) \|", text, flags=re.MULTILINE)
    next_free = re.findall(rf"\*\*Next free id: {prefix}-(\d{{2,}})\*\*", text)
    if not row_ids and not next_free and pending_rows and len(pending_next) == 1:
        if text.count(f"{prefix}-__") != len(pending_rows) + 1:
            return "invalid", "placeholder outside a row or the next-free line"
        return "unallocated", f"{len(pending_rows)} rows not yet allocated"
    if pending_rows or pending_next:
        return "invalid", "partly allocated"
    if not row_ids:
        return "invalid", "no rows found"
    expected = [base + i for i in range(1, len(row_ids) + 1)]
    actual = [int(x) for x in row_ids]
    if actual != expected:
        return "invalid", f"row ids {actual} != expected {expected}"
    if len(next_free) != 1 or int(next_free[0]) != expected[-1] + 1:
        return "invalid", f"next free id {next_free} != {expected[-1] + 1}"
    return "allocated", f"rows {prefix}-{expected[0]:02d}..{prefix}-{expected[-1]:02d} ({len(expected)}), next free {prefix}-{expected[-1] + 1:02d}"


def allocate(ledger: str, prefix: str, base: int) -> int:
    path = Path(norm(ledger))
    text = path.read_bytes().decode("utf-8")
    state, detail = check_allocation(text.encode("utf-8"), prefix, base)
    if state != "unallocated":
        print(f"ALLOCATE FAIL {norm(ledger)}: {detail}")
        return 1
    counter = {"n": base}

    def row_sub(match: re.Match[str]) -> str:
        counter["n"] += 1
        return f"| {prefix}-{counter['n']:02d} |"

    text = re.sub(rf"^\| {prefix}-__ \|", row_sub, text, flags=re.MULTILINE)
    text = text.replace(f"**Next free id: {prefix}-__**", f"**Next free id: {prefix}-{counter['n'] + 1:02d}**")
    path.write_bytes(text.encode("utf-8"))
    rows = counter["n"] - base
    print(f"ALLOCATED {norm(ledger)}: {prefix}-{base + 1:02d}..{prefix}-{counter['n']:02d} ({rows} rows), next free {prefix}-{counter['n'] + 1:02d}")
    return 0


def verify(manifest: str, ref: str | None, bases: dict[str, int], append_only: list[str]) -> int:
    append_only = [norm(p) for p in append_only]
    raw = Path(norm(manifest)).read_text(encoding="utf-8-sig")
    lines = [ln for ln in raw.splitlines() if ln.strip()]
    failures = 0
    for line in lines:
        digest, length, path = line.split("  ", 2)
        path = norm(path)
        try:
            data = read_bytes(path, ref)
        except FileNotFoundError as missing:
            print(f"FAIL {path}: {missing}")
            failures += 1
            continue
        note = ""
        if path in LEDGERS:
            prefix = LEDGERS[path]
            state, detail = check_allocation(data, prefix, bases[prefix])
            note = f" (ids: {detail})"
            if state == "invalid" or (state == "unallocated" and ref is not None):
                print(f"FAIL {path}: allocation {detail}")
                failures += 1
                continue
            data = fold_ids(data, prefix)
        if path in append_only:
            data = data[: int(length)]
            note += " (append-only prefix)"
        actual = hashlib.sha256(data).hexdigest()
        if actual == digest and len(data) == int(length):
            print(f"PASS {path}{note}")
        else:
            print(f"FAIL {path}: sha256 {actual} bytes {len(data)} != {digest} bytes {length}")
            failures += 1
    source = f"ref {ref}" if ref else "working tree"
    verdict = "PASS" if failures == 0 else "FAIL"
    print(f"BUNDLE VERIFY ({source}): {verdict} {len(lines) - failures}/{len(lines)}")
    return 0 if failures == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    a = sub.add_parser("allocate")
    a.add_argument("--ledger", required=True)
    a.add_argument("--prefix", required=True, choices=["PR", "CF"])
    a.add_argument("--base", required=True, type=int)
    v = sub.add_parser("verify")
    v.add_argument("--manifest", required=True)
    group = v.add_mutually_exclusive_group(required=True)
    group.add_argument("--ref")
    group.add_argument("--worktree", action="store_true")
    v.add_argument("--base-pr", type=int, default=0)
    v.add_argument("--base-cf", type=int, default=0)
    v.add_argument("--append-only", nargs="*", default=[])
    args = parser.parse_args()
    if not at_repo_root():
        print("NOT AT REPOSITORY ROOT: run this from the top of the clone")
        return 2
    if args.command == "allocate":
        return allocate(args.ledger, args.prefix, args.base)
    bases = {"PR": args.base_pr, "CF": args.base_cf}
    return verify(args.manifest, None if args.worktree else args.ref, bases, args.append_only)


if __name__ == "__main__":
    sys.exit(main())
