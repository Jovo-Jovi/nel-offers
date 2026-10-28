# NELO — Development Journal

Newest entry last. One entry per session or task: what happened, what was found, what is next.
Facts here are history; current state is in `SESSION_CONTEXT.md`.

## 2026-10-28 — Reviewer session 1 (blueprint)

- Fetched `Jovo-Jovi/nel-offers`: empty, no refs. An anonymous `git ls-remote` succeeded, so
  the repository was publicly readable; logged as a carry-forward and made a precondition of
  every push.
- Read the template: sheet `Offers` with the nine fixed headers and its data validations; the
  read-me sheet defines required columns, Cairo-time `ends_on`, row-order fallback for
  `display_order`, and deletion in the dashboard.
- Read the design pack (text): home with search and numbered cards; one page per code with
  video, price, end date, conditions, three images, WhatsApp, call and order.
- Copied NEL's `tokens.css` and mark into the bundle at NEL commit `b95a75b3`, with hashes.
- Wrote the blueprint and OD-01; issued T01 to land them once OD-01 is signed.

## 2026-10-28 — Reviewer session 1, amendment before signature

- The human reported the Supabase project is in Frankfurt (`eu-central-1`), not Zurich;
  OD-01 item 1 corrected.
- Repository confirmed private, `main` with one empty commit, no files (fetched with session
  access). The human will make it public until go-live for GitHub Actions; OD-01 item 2
  rewritten, public-repository rules added as precedents.
- Usage ledger added (`PHASES.md` §5, OD-01 item 19); T01 builds it and records the
  blueprint runs.

## 2026-10-28 — T01 (builder)

- LANDING: `3671648675a6fbdaf2317b4624586e1eb4fc52d1`.
- Allocated PRECEDENTS base 0 + 29 rows = PR-01..PR-29, next free PR-30. Allocated CARRY_FORWARDS base 0 + 10 rows = CF-01..CF-10, next free CF-11.
- `npm run guard:naming` exit 0. `npm run guard:design` exit 0. `npm run guard:literals` exit 0. `npm run guard:boundary` exit 0.
- Self-checks exit 0. naming: string fail 2/2 pass 3/3, file fail 2/2 pass 3/3. design: string fail 5/5 pass 4/4, file fail 5/5 pass 4/4. literals: string fail 6/6 pass 3/3, file fail 6/6 pass 3/3. boundary: string fail 4/4 pass 4/4, file fail 4/4 pass 4/4.
- `node scripts/usage/report.mjs --check` exit 0. `npm run lint` exit 0. `npm run typecheck` exit 0. `npm run build` exit 0. `npm audit --omit=dev --audit-level=high` exit 0. `npm run evidence` exit 0.
- Implements SECURITY_MODEL.md §1 and §7, DESIGN_SYSTEM.md §§3–8, DECISIONS.md OD-01 item 4, GLOSSARY.md §4, DATA_MODEL.md §6, BOUNDARY_MODEL.md §4 and §5, PHASES.md §5.
- Deviation: the scaffold sets `cacheComponents`, which refuses `dynamicParams`. A locale segment outside `src/i18n/config.ts` is not found via `notFound()` in the locale layout. `next build` and `next start` warn that a lockfile outside this repository was ignored, and both exited 0.
