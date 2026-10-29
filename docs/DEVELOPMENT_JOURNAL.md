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

## 2026-10-28 — Reviewer session 2 (T01 verdict)

- Fetched `t01-foundation` at `23babfbc`. Re-ran the bundle verification (19/19 at LANDING
  and HEAD), the four guards and their self-checks, lint, typecheck, a clean build, the audit
  and the usage check. Served the build and checked status, redirects, cookies and `<html>`
  attributes. Compared every catalogue string with `DESIGN_SYSTEM.md` §9: 28 keys, 0
  mismatches. Viewed the four screenshots.
- Planted violations in a scratch tree: every guard failed as it should. Gaps logged as
  carry-forwards: literals reports only the first finding per rule and file; design misses
  JSX style objects and matches a variable named `dir`; naming's SQL mode reads comments and
  string literals and flags `auth.users`.
- Verdict T01: PASS. T02 issued with the reviewer-authored migration and RLS proof,
  rehearsed on PostgreSQL 16 with a Supabase stub: proof 47/47, and 42/47 with three planted
  policy and grant defects.

## 2026-10-29 — T02 (builder)

- LANDING: `606d6a2d059b00d0b4d151936373cce4a071ae92`.
- Allocated CARRY_FORWARDS base 10 + 4 rows = CF-11..CF-14, next free CF-15.
- `npm run guard:naming` exit 0. `npm run guard:design` exit 0. `npm run guard:literals` exit 0. `npm run guard:boundary` exit 0. The migration and the proof passed.
- Self-checks exit 0. naming: string fail 4/4 pass 6/6, file fail 4/4 pass 6/6. design: string fail 7/7 pass 5/5, file fail 7/7 pass 5/5. literals: string fail 7/7 pass 3/3, file fail 7/7 pass 3/3. boundary: string fail 4/4 pass 4/4, file fail 4/4 pass 4/4.
- `node scripts/usage/report.mjs --check` exit 0. `npm run lint` exit 0. `npm run typecheck` exit 0. `npm run test:unit` exit 0 (14 passed). `npm run build` exit 0. `npm audit --omit=dev --audit-level=high` exit 0. `npx playwright test e2e/operator-access.spec.ts` exit 0 (5 passed). `npm run evidence` exit 0.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- Deviation: `npm install --save-dev vitest` resolved vitest 5, whose optional peer on `@types/node@^22` conflicts with this repository's `@types/node@^20`. Installed vitest 4.1.12, which accepts `@types/node` 20. `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and still exits 0.
- Deviation: UNRATIFIED. `scripts/guard/naming.mjs` skips only the filenames `media-name.ts` and `media-limits.ts`. The task requires those names and a passing guard. Identifiers inside the files are still scanned.
- Deviation: the mark is an `img`. `next/image` writes an inline style, and the content security policy has no `style-src`. Playwright recorded no policy violation.
- Deviation: `check:r2` did not need `WHEN_REQUIRED` checksum settings.
- Deviation: `next build` and `next start` still warn that a lockfile outside this repository was ignored. Both exited 0.
- Deviation: the local env file has no `NEXT_PUBLIC_SITE_URL`. This task does not read that name.

## 2026-10-29 — Reviewer session 3 (T02 verdict)

- Fetched `t02-data-auth-storage` at `29f9cd52`. Re-ran the bundle verification (7/7 at LANDING
  and HEAD), the four guards with their self-checks, lint, typecheck, the unit specs, a clean
  build, the audit and a secret sweep of every T02 commit. Served the build: public pages set no
  cookie, every response carries the nonce CSP and the static headers, operator responses add
  `no-store` and `X-Robots-Tag`, an anonymous overview redirects to sign-in, both upload routes
  answer 401, and nonces differ per request.
- Re-probed the three guard gaps of T01 in a scratch tree; each is now caught. CF-11, CF-12 and
  CF-13 close.
- Read the proxy, the Operator gate, sign-in, TOTP, the R2 client and both upload routes. One
  defect: a repeated finalise deletes a recorded object. Logged with the naming guard's filename
  exemption (a T02 fence defect), the Vercel GitHub connection, Vercel Hobby's terms and the
  unmet T02 preconditions.
- Verdict T02: FAIL on missing evidence only — the RLS proof on the real project, a sign-in
  through TOTP, the column check. The human attests them at the T03 handover; with them the gate
  closes as PASS and PR #2 is merged. T03 issued with OD-02, migration 2 and its proof, rehearsed
  on PostgreSQL 16 with a Supabase stub: presentation proof 17/17, RLS proof still 47/47, and
  each fails on planted defects.

## 2026-10-29 — T03 (builder)

- LANDING: `1776a5b37e0c6fa417b2e31a9b7956cc76f6287d`.
- Allocated CARRY_FORWARDS base 14 + 5 rows = CF-15..CF-19, next free CF-20. CF-11, CF-12 and CF-13 read `CLOSED (T02)`. No other existing cell was changed. CF-15 and CF-16 stay open until a verdict; a repeated finalise no longer deletes a recorded object, and the filename exemption is gone.
- `npm run guard:naming` exit 0. `npm run guard:design` exit 0. `npm run guard:literals` exit 0. `npm run guard:boundary` exit 0.
- Self-checks exit 0. naming: string fail 5/5 pass 7/7, file fail 5/5 pass 7/7. design: string fail 9/9 pass 6/6, file fail 9/9 pass 6/6. literals: string fail 7/7 pass 3/3, file fail 7/7 pass 3/3. boundary: string fail 4/4 pass 4/4, file fail 4/4 pass 4/4.
- `node scripts/usage/report.mjs --check` exit 0. `npm run lint` exit 0. `npm run typecheck` exit 0. `npm run test:unit` exit 0 (26 passed). `npm run build` exit 0. Both template traces print `True`. `npm audit --omit=dev --audit-level=high` exit 0 (2 moderate). `npx playwright test` exit 0 (11 passed). `npm run evidence` exit 0.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Human-attested gate row: drift 0, campaign_offers 6, not_synthetic 0, media_objects 5, orphans 0.
- The campaign is unpublished. SYN-001 through SYN-006, their media objects and the synthetic banner remain. SYN-009 was removed.
- Deviation: a stale confirm does not surface SQLSTATE 40001. The call holds its lock until the gateway times out. The route aborts that call after 8 seconds and answers 409 `changed-since-preview` for an abort, `upstream request timeout`, `preview again`, or 40001. The next preview returns 200. `supabase/` was not edited.
- Deviation: exceljs cannot load the template until comment and vml relationships are removed from a copy. The download serves the original bytes. jszip stays a transitive dependency.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: Playwright counts Node's `NO_COLOR`/`FORCE_COLOR` warning as an error outside any test. The config deletes `NO_COLOR` before the workers start, and the suite exits 0.
- Deviation: the layout spec reads the served document for `style=`. After hydration the framework inserts a route announcer with a style attribute. The served HTML has none.

## 2026-10-29 — Reviewer session 4 (T03 verdict)

- Fetched `t03-dashboard` at `3f18f7b6`. Re-ran the bundle verification (12/12 at LANDING and
  HEAD), compared the landed carry-forward rows and journal entry with the fence (exact), and
  re-ran the four guards with their self-checks, lint, typecheck, the unit specs (26), a clean
  build with both template traces, the audit and the usage check. Served the build: public pages
  set no cookie and carry no `style` attribute, every dashboard page redirects to sign-in without
  a session, and every operator route handler answers 401. Viewed all 28 screenshots.
- Reviewed `f79ceae`, merged through PR #3 outside a fence: it raises the TOTP QR size bound only.
- Findings: the import function's stale-preview refusal used SQLSTATE 40001, which PostgREST
  retries without end — a defect in the reviewer's migration that the T03 spec triggered on the
  live project; Arabic dates reordered inside `LatinRun`; `jszip` imported without being
  declared; the sign-in screenshots taken while signed in.
- Verdict T03: FAIL. T03-F issued with `20261029020000_nelo_import_conflict.sql` (`PT409`) and the
  amended RLS proof, rehearsed on PostgreSQL 16: proof 47/47 and presentation proof 17/17 after
  it; without it the amended proof aborts. CF-02, CF-04, CF-15, CF-16 and CF-19 close.

## 2026-10-29 — T03-F (builder)

- LANDING: `2c008d3ed1bdd59e15b3e468697f6df31d6414fb`.
- Allocated CARRY_FORWARDS base 19 + 5 rows = CF-20..CF-24, next free CF-25. Open rows 16 − 5 + 4 = 15. CF-02, CF-04, CF-15, CF-16 and CF-19 read `CLOSED (T03)`. No other existing cell was changed. CF-24 is born `CLOSED (T03)`. PRECEDENTS base 29 + 1 = PR-30, next free PR-31.
- `npm run guard:naming` exit 0. `npm run guard:design` exit 0. `npm run guard:literals` exit 0. `npm run guard:boundary` exit 0.
- Self-checks exit 0. naming: string fail 5/5 pass 7/7, file fail 5/5 pass 7/7. design: string fail 9/9 pass 6/6, file fail 9/9 pass 6/6. literals: string fail 7/7 pass 3/3, file fail 7/7 pass 3/3. boundary: string fail 4/4 pass 4/4, file fail 4/4 pass 4/4.
- `node scripts/usage/report.mjs --check` exit 0. `npm run lint` exit 0. `npm run typecheck` exit 0. `npm run test:unit` exit 0 (28 passed). `npm run build` exit 0. `npm audit --omit=dev --audit-level=high` exit 0 (2 moderate). `npx playwright test` exit 0 (11 passed). The stale confirm answered 409 `changed-since-preview` in 298 ms. `npm run evidence` exit 0.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Human-attested gate row: drift 0, campaign_offers 6, not_synthetic 0, media_objects 5, orphans 0.
- Human-attested `xact_rollback`: 7058720, then 7058720 ten seconds later. Difference 0.
- The campaign is unpublished. SYN-001 through SYN-006 remain. SYN-009 was removed.
- Deviation: step 2 also showed the untracked task prompt. The human said to continue. That file is not committed.
- Deviation: the import spec removes existing `SYN-` offers before the seven-addition preview, and its timeout is 300 seconds, because T03 left those offers in place. The campaign spec removes an existing banner before the first upload, because T03 left the synthetic banner.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0. The served build prints the same warning and names `outputFileTracingRoot`.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
