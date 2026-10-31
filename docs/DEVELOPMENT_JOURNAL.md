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

## 2026-10-29 — T03-F (builder, CI)

- `ci / verify` failed on `ba78f39` because `guard:naming` rejects the bare noun in `removeSyntheticOffers`. The helper is now `removeSyntheticCampaignOffers`. The other CI steps had not run.

## 2026-10-29 — Reviewer session 5 (T03-F verdict)

- Fetched `t03-dashboard` at `cae7457b`. Re-ran the bundle verification (3/3 at LANDING and
  HEAD; the T03 manifest's design-system line superseded), compared the landed rows, the new
  precedent and the journal entry with the fence (exact), and re-ran a clean install, the four
  guards with their self-checks, lint, typecheck, the unit specs (28) and the audit. Read the
  confirm route (`PT409` mapped, no abort), the formatters and the workbook loader. Viewed the
  changed screenshots: Arabic dates read `18/11/2026`; the sign-in pages show the sign-in form.
- The human attested the retrying backends terminated, migration 3 applied, both proofs passing,
  the gate row at zero drift and a flat rollback counter.
- `ba78f39` failed `guard:naming` in CI after the report's local run; fixed at `cae7457`. Logged
  and closed.
- Verdict T03-F: PASS; with it T03 passes. CF-20 to CF-23 close. T04 issued with the designer's
  source as reference, the wiring decisions (`DESIGN_SYSTEM.md` §11.1), the go-live list with
  staging on the Vercel address, and the synthetic reset, rehearsed on PostgreSQL 16: it refuses
  while rows remain and resets to zero after.

## 2026-10-29 — T04 (builder)

- LANDING `bb57484c51d6cadb47acc22a40d1c8d5c6445acb`. `T04 BUNDLE PASS 23 / 23 []` and manifest `7edd8e6f56450022bad60c5e2fa223e0e52fbb4c9413b210250f3c4f42a77bd2`, at LANDING and at the checks commit. Carry-forwards `25 11 ['26']`: 24 + 1 rows, next free 26, open 15 − 4 = 11. CF-20 to CF-23 are `CLOSED (T03-F)`. CF-25 was born closed.
- Ids: `72e7805` public data, search, links and catalogue copy; `f674b7b` public pages; `876e8b2` specs and evidence capture; `a7d9cb8` synthetic-code guard and preview keys; `880edb5` Arabic search query; `8b32db7` checks and evidence.
- On `8b32db7`, `git status --porcelain` was empty. `guard:naming`, `guard:design`, `guard:literals` and `guard:boundary` exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. `npm run lint` exited 0. `npm run typecheck` exited 0. `npm run test:unit` 36 passed. The secret sweep printed nothing. Tracked count of `.env.local` and `e2e/.auth` is 0. The T01–T03 evidence diff from LANDING is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). `package.json` dependencies are unchanged.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 20 passed. `auth.setup.ts` 1, `operator-access.spec.ts` 5, `dashboard-1-guard.spec.ts` 1, `dashboard-2-import.spec.ts` 1, `dashboard-3-uploads.spec.ts` 1, `dashboard-4-campaign.spec.ts` 1, `dashboard-5-layout.spec.ts` 1, `public-site.spec.ts` 9.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: awaiting the human (PR-24). The builder did not run SQL. The campaign is unpublished.
- `npm run evidence` exited 0. `docs/evidence/T04/` has the 16 screenshots and `headers.json`. `/` and `/en` are 200; the three CampaignOffer URLs are 404. Each response has a nonce CSP and the static headers.
- Deviation: `loading.tsx` starts the response at 200 before `notFound()` can set the status. The proxy reads visibility through RLS only and rewrites a hidden code, an unknown path, and an unknown first segment to `[locale]/missing`, which calls `notFound()` before a loading boundary. `/fr` is Arabic; `/en/nope` is English.
- Deviation: SYN-002 has a video and no main image, so the poster attribute is absent. The spec compares that with the attachment rows.
- Deviation: while the campaign is unpublished the dashboard marks every row Hidden, so the opening public spec checks the `SYN-` prefix only. Scheduled and ended codes are the 404 cases after publish.
- Deviation: the dashboard layout spec rewrote three T03 screenshots during the run. They were restored before `git add`. The committed T01–T03 evidence diff is empty.
- Deviation: `npm run start` was already running so Playwright could reuse it and `npm run evidence` could use the same server.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0. The served build names `outputFileTracingRoot`.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.

## 2026-10-29 — T04 (gate row)

- Human-attested gate row: drift 0, campaign_offers 6, not_synthetic 0, media_objects 5, orphans 0. `media_objects` equals `SCAN objects=5`. The builder did not run SQL.

## 2026-10-29 — Reviewer session 6 (T04 verdict)

- Fetched `t04-public-golive` at `b5413672`. Re-ran the bundle verification (23/23 at LANDING
  and HEAD), compared the landed row and journal entry with the fence (exact), and re-ran a clean
  install, the four guards with their self-checks, lint, typecheck, the unit specs (36) and the
  audit. Served the build: public pages set no cookie and carry no `style` attribute; `/fr` and
  `/en/nope` answer 404; `/ar` and `/ar/x` answer 404 where T01 answered 308. Viewed all 16
  screenshots beside the approved ones.
- The pages follow the approved design: header with the mark, hero, card grid, CampaignOffer
  layout, price card, date boxes, the mobile dock, mirrored arrows. Accepted deviation: the proxy
  reads one CampaignOffer through RLS so that hidden codes and unknown paths keep a 404 status.
- Findings: the `/ar` redirect lost; the gallery preview shows no image; an empty band under the
  main media; the banner and coming-soon evidence not showing their states.
- Verdict T04: FAIL. T04-F issued. CF-14 (localized not-found) and CF-17 (Vercel can see the
  repository; the PR shows a Vercel deployment) close.

## 2026-10-29 — T04-F (builder)

- LANDING `7fa19592f7cc8ed4d50a4b73543f31286dfe068c`. Carry-forwards `29 13 ['30']`: 25 + 4 rows, next free 30, open 11 − 2 + 4 = 13. CF-14 and CF-17 are `CLOSED (T04)`. CF-26 to CF-29 are open.
- Fixes at `41754436e8d27e26a27d3959ea6b686b1a1e7a69`. A path whose first segment is the default locale skips the visibility read and uses the existing 308. The preview image is sized to the viewport width with `object-contain`. The main-media figure no longer stretches, and the image or video fills the frame. The synthetic banner is a 1600×600 PNG of two solid bands, replaced when the stored banner is not that size. Coming-soon shots wait until `home.comingSoon` is visible.
- On that commit, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 36 passed. The secret sweep printed nothing. Tracked count 0. The T01–T03 evidence diff from LANDING is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). `package.json` dependencies are unchanged. Nothing under `supabase/` changed.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 21 passed. The three redirects answer 308 with Location pathnames `/`, `/x` and `/campaign-offers/SYN-001`. The preview image box is `0,227 390x390` in a `390x844` viewport, in both locales.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: awaiting the human (PR-24). The builder did not run SQL. The campaign is unpublished.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0. The served build names `outputFileTracingRoot`.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: the dashboard layout spec rewrote two T03 overview screenshots. They were restored before `git add`. The committed T01–T03 evidence diff is empty.
- Deviation: `npm run evidence` rewrote `docs/evidence/T04/headers.json` (new nonces and dates). The retake list did not name that file; step 5 requires the command.

## 2026-10-29 — Reviewer session 7 (T04-F verdict, OD-03)

- Fetched `t04-public-golive` at `6aea7dbd`. Compared the landed rows and journal entry with the
  fence (exact), re-ran the four guards with their self-checks, lint, typecheck, the unit specs
  (36) and a build; dependencies and `supabase/` unchanged. Served the build: `/ar`, `/ar/x` and
  `/ar/campaign-offers/SYN-001` answer 308 again. Viewed the retaken screenshots: the two-band
  banner in the hero, no band under the main media, the enlarged preview image, the coming-soon
  text in both locales. The human attested the gate row at zero drift.
- Verdict T04-F: PASS; with it T04 passes. CF-26 to CF-29 close.
- The human tested the Vercel address and asked for `/ar` prefixes, the lab-site link and the
  footer on the coming-soon page, a different message for unknown paths, and `/dashboard`.
  Recorded as OD-03 (signed by that message). T04-F2 issued with
  `20261029030000_nelo_campaign_row_public.sql` and the amended RLS proof, rehearsed on
  PostgreSQL 16: proof 47/47 and presentation proof 17/17 after it; the old proof after it and
  the new proof without it each fail check 45 alone.

## 2026-10-29 — T04-F2 (builder)

- LANDING `9feec6cbd24928c9c494f318fc6776ae0bdf1227`. `T04F2 BUNDLE PASS 6 / 6 []` at LANDING and at the checks commit. Carry-forwards `29 9 ['30']`: 29 rows, next free 30 unchanged, open 13 − 4 = 9. CF-26 to CF-29 are `CLOSED (T04-F)`.
- Ids: `4d2213eef995f539029109b665b1ebe9fbe6104d` locale prefixes, dashboard redirects, the coming-soon shell and the two not-found messages; `3428d3f7ac28d454786b5145e92257b27ba288f2` specs; `a2306f79b20cf07881b7ffc2554495c2b2458cce` checks and evidence.
- On `a2306f79b20cf07881b7ffc2554495c2b2458cce`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 36 passed. The secret sweep printed nothing. Tracked count 0. The T01–T04 evidence diff from LANDING is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). `package.json` dependencies are unchanged. Nothing under `supabase/` changed after LANDING.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 22 passed. `/` answers 307 `/ar`; `/campaign-offers/SYN-001` answers 307 `/ar/campaign-offers/SYN-001`; `/operator/sign-in` answers 307 `/ar/operator/sign-in`; `/dashboard` and `/ar/dashboard` answer 307 `/ar/operator/overview`; `/en/dashboard` answers 307 `/en/operator/overview`. `/ar/operator/overview` without a session ends on `/ar/operator/sign-in` with `no-store` and `X-Robots-Tag`.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: awaiting the human (PR-24). The builder did not run SQL. The campaign is unpublished.
- `npm run evidence` exited 0. `docs/evidence/T04-F2/` has the ten screenshots and `headers.json`. `/` and `/dashboard` are 307; `/ar`, `/en` and `/ar/operator/sign-in` are 200, the last with `no-store` and `X-Robots-Tag`; `/ar/nope` is 404.
- Deviation: the campaign was published when the suite first started, so the first publish confirmation was the coming-soon dialog. It was unpublished through the operator switch, and the passing run is the one recorded.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0. The served build names `outputFileTracingRoot`.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: `npm run start` was already running, so the passing Playwright run reused it and `npm run evidence` used the same server.

## 2026-10-29 — Reviewer session 8 (T04-F2 verdict, OD-04)

- Fetched `t04-f2-routes` at `24e62f5`. Verified the bundle (6/6 at LANDING and HEAD), compared the
  ledger changes, the journal entries and the usage records with the fence (exact), and re-ran a
  clean install, the four guards with their self-checks, lint, typecheck, the unit specs (36) and the
  build. Served the build: `/` and unprefixed page paths answer 307 to `/ar`; `/ar` and `/en` 200;
  `/dashboard` 307 to `/ar/operator/overview` and `/en/dashboard` to `/en/operator/overview`; the
  overview sends a Visitor without a session to sign-in. Viewed the coming-soon and not-found
  screenshots in both locales. The human attested the gate row (drift 0) and CI success on PR #6.
- Verdict T04-F2: PASS; with T04-F, T04 passes. PR #6 may be merged.
- The human's requests after testing on the Vercel address are signed as OD-04. Not adopted: adding
  or editing a CampaignOffer by hand, which the offer content gate forbids (OD-04 item 9).
- Reviewer-authored for T05 and rehearsed on PostgreSQL 16 over verified TLS: migration
  `20261029040000_nelo_operator_controls.sql` (show switch, removal of one slot); its proof (16/16;
  15/16 with the policies planted without `is_shown`; fails before the migration); the existing
  proofs after it (47/47, 17/17); the gate read; and `scripts/sql/run.mjs`, which refused an edited,
  untracked or unlisted file, a migration without `--apply`, and a certificate that does not sign
  the server.

## 2026-10-29 — T05 (builder)

- LANDING `0885ba5d54c2b7fae31482fb6a0e529f60f24c28`. `T05 BUNDLE PASS 17 / 17 []` at LANDING and at `a36b90bd9b74412ebe62acccc11d67eaca5a9568`. Carry-forwards `30 10 ['31']`: 29 + 1 = 30 rows, next free 31, open 9 + 1 = 10. Precedents `32 ['33']`: 30 + 2 = 32, next free 33.
- Ids: `91a7ec69100ee65fcad4ad101588daaca4c3e671` SQL runner wiring; `a36b90bd9b74412ebe62acccc11d67eaca5a9568` operator controls, specs and evidence.
- On `a36b90bd9b74412ebe62acccc11d67eaca5a9568`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 36 passed. The secret sweep printed nothing. Tracked count 0. The T01–T04-F2 and `supabase/` diff from LANDING is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). The only new dependency is `pg@8.23.1`.
- SQL `supabase/migrations/20261029040000_nelo_operator_controls.sql` sha256=33524fe27193 / APPLIED. SQL `supabase/checks/nelo_rls_proof.sql` sha256=d68a48c8064b / RAISED RLS PROOF (rolled back): PASS 47/47. SQL `supabase/checks/nelo_rls_proof_presentation.sql` sha256=0dfacc5b5b90 / RAISED PRESENTATION PROOF (rolled back): PASS 17/17. SQL `supabase/checks/nelo_rls_proof_operator_controls.sql` sha256=8b8242317769 / RAISED OPERATOR CONTROLS PROOF (rolled back): PASS 16/16.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 24 passed. Evidence is `docs/evidence/T05/` (sixteen screenshots and `meta.json`). Link-preview image URLs are stored as `<site>/share/nelo-share.png`.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row after the specs: `ROW drift=0 campaign_offers=6 not_synthetic=0 switched_off=0 media_objects=5 orphans=0`. The campaign is unpublished and every CampaignOffer is shown. CI is not attested.
- Deviation: the campaign was already published when an earlier dashboard run reached the publish switch, so that dialog was the coming-soon text. It was unpublished through the operator switch before the recorded run. The recorded run starts unpublished and leaves it unpublished.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: `NEXT_PUBLIC_SITE_URL` is unset, so the running build warns that `metadataBase` falls back to `http://localhost:3000`. The share evidence rewrites that origin to `<site>`.

## 2026-10-29 — Reviewer session 9 (T05 verdict)

- Fetched `t05-operator-controls` at `e0101f7` (PR #7). Verified the bundle (17/17 at LANDING and
  HEAD), compared the ledger rows, the journal entries and the usage record with the fence (exact),
  checked the wiring diff (`pg` 8.23.1 only) and that nothing under `supabase/` or earlier evidence
  changed, and re-ran a clean install, the four guards with their self-checks, lint, typecheck, the
  unit specs (36), the audit and the build. Served the build: the favicon, icons and share image
  answer 200; `/ar` and `/en` carry the Open Graph and Twitter tags in the head, also for a WhatsApp
  user agent; the sign-in page carries none; `/ar` sets no cookie. Read the presign route (code and
  slot only; a body with `name` is 422) and the two new server actions. Read CI success on `e0101f7`
  from GitHub.
- Through the SQL runner: migration 5 applied; proofs 47/47, 17/17 and 16/16; gate row drift 0,
  orphans 0; the scan clean.
- Findings: the gallery preview shows a picture smaller than the screen at its own size and the
  spec's fill check was dropped; three dashboard screenshots show the loading skeleton; the
  CampaignOffer cards lack thumbnails and "Replace", the status sits where the switch's label
  belongs, the bottom bar's labels are cut off, a missing start date reads "None", queue sizes have
  no unit. The report gave no output for steps 1–2; verified here instead.
- Verdict T05: FAIL. T05-F issued. CF-30 closes: the library, slot removal and a clean scan.

## 2026-10-29 — T05-F (builder)

- LANDING `98ee37d1d0085267cebac5db15d19066ce652be6`. Carry-forwards `34 12 ['35']`: 30 + 4 = 34 rows, next free 35, open 10 − 1 + 3 = 12. CF-30 is `CLOSED (T05)`. CF-31 to CF-33 are open. CF-34 is `CLOSED (T05)`.
- Ids: `98ee37d1d0085267cebac5db15d19066ce652be6` ledger, T05 verdict entry and usage record; `c8af45a47e3ff1a8a8fa86df0b9402d50aec4d55` preview fill, slot tiles, labels and evidence.
- On `c8af45a47e3ff1a8a8fa86df0b9402d50aec4d55`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 36 passed. The secret sweep printed nothing. Tracked count 0. The diff from LANDING for T01–T04-F2 evidence, `supabase/`, `scripts/sql/`, `package.json` and `package-lock.json` is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). No dependency was added.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 24 passed. `preview-picture 24,251 342x342 viewport 390x844`. `preview-picture 294,24 852x852 viewport 1440x900`.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: `ROW drift=0 campaign_offers=6 not_synthetic=0 switched_off=0 media_objects=5 orphans=0`. The campaign is unpublished and every CampaignOffer is shown. CI is not attested.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: `NEXT_PUBLIC_SITE_URL` is unset, so the running build warns that `metadataBase` falls back to `http://localhost:3000`.
- Deviation: dashboard screenshots below 1024 px are the viewport, so the fixed bottom bar is fully in the frame. Wider shots stay full-page.

## 2026-10-29 — Reviewer session 10 (T05-F verdict, the human's test)

- Fetched `t05-operator-controls` at `3f9910d` (PR #7). Compared the ledger changes, the journal
  entries and the usage record with the fence (exact); nothing under `supabase/`, `scripts/sql/`,
  the dependencies or earlier evidence changed. Re-ran the four guards with their self-checks,
  lint, typecheck, the unit specs (36), the audit and the build. Read the preview fit (ratio set on
  load, no inline style in markup), the slot thumbnails and the bottom-bar labels, and viewed the
  retaken screenshots: the preview picture 342 × 342 at 390 and 852 × 852 at 1440, no skeleton,
  thumbnails with Replace and Remove, the switch's own label, uncut labels. CI success on `3f9910d`
  read from GitHub.
- Verdict T05-F: PASS; with it T05 passes. PR #7 merged as `6ed565f`. CF-31 to CF-33 close.
- The human tested on the Vercel address. Findings: choosing a sheet on the Import page shows
  nothing; the status words are unclear; actions want motion. T05-F2 issued, with `ADMIN_SPEC.md`
  §§4 and 10 amended. Not adopted: adding a CampaignOffer by hand (the offer content gate, OD-04
  item 9), and showing an uploaded file's original name (never sent or stored, `BOUNDARY_MODEL.md`
  §3.1 item 1).

## 2026-10-29 — T05-F2 (builder)

- LANDING `19130ad519bdfb5c33c78748b9e0587e2e7ec584`. Bundle `T05F2 BUNDLE PASS 1 / 1 []` at LANDING and at HEAD. Carry-forwards `36 11 ['37']`: 34 + 2 = 36 rows, next free 37, open 12 − 3 + 2 = 11. CF-31 to CF-33 are `CLOSED (T05-F)`. CF-35 and CF-36 hold the landed rows and stay `OPEN`.
- Ids: `19130ad519bdfb5c33c78748b9e0587e2e7ec584` ADMIN_SPEC amendment, carry-forward changes, T05-F verdict entry and usage records; `0f5a22215187a93ee759ac96b80c4bcc0ae91f69` import selection and preview, status words, motion and evidence.
- On `0f5a22215187a93ee759ac96b80c4bcc0ae91f69`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 36 passed. The secret sweep printed nothing. Tracked count 0. The diff from LANDING for T01–T05 evidence, `docs/ADMIN_SPEC.md`, `supabase/`, `scripts/sql/`, `package.json` and `package-lock.json` is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). No dependency was added.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 26 passed. `stale-confirm 572ms`. `preview-picture 24,251 342x342 viewport 390x844`. `preview-picture 294,24 852x852 viewport 1440x900`.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: `ROW drift=0 campaign_offers=6 not_synthetic=0 switched_off=0 media_objects=5 orphans=0`. The campaign is unpublished and every CampaignOffer is shown. CI is not attested.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: `NEXT_PUBLIC_SITE_URL` is unset, so the running build warns that `metadataBase` falls back to `http://localhost:3000`.
- Deviation: the controls spec still writes the T05 dashboard shots. Those bytes were restored before the evidence commit, so `docs/evidence/T05` is unchanged.

## 2026-10-29 — Reviewer session 11 (T05-F2 verdict, go-live 1)

- Fetched `t05-f2-import` at `1f6af14`. Verified the bundle (1/1 at LANDING and HEAD) and compared
  the ledger changes, the journal entries and the usage records with the fence (exact); nothing under
  `supabase/` or `scripts/sql/`, no dependency, no earlier evidence and no `docs/ADMIN_SPEC.md` byte
  changed after LANDING. Re-ran the four guards with their self-checks, lint, typecheck, the unit
  specs (36), the audit and the build. Read the import panel (the chosen sheet's name and size shown
  in the browser, the preview started on choice, `sheet.xlsx` sent) and viewed the four screenshots.
  CI success on `1f6af14` read from GitHub.
- Verdict T05-F2: PASS. CF-35 and CF-36 close. CF-37 records three small Import-page gaps for a
  polish task after launch.
- Go-live 1 issued: the synthetic data leaves the project (go-live step 3) through the SQL runner.

## 2026-10-29 — Go-live 1 (builder)

- LANDING `16205613465571f9046154a76c733a5f3e2a90f7`. Carry-forwards `37 10 ['38']`: 36 + 1 = 37 rows, next free 38, open 11 − 2 + 1 = 10. CF-35 and CF-36 are `CLOSED (T05-F2)`. CF-37 is the id allocated for this landing and stays `OPEN`.
- Gate read before the reset: `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6` and `ROW drift=0 campaign_offers=0 not_synthetic=0 switched_off=0 media_objects=0 orphans=0`.
- Reset: `SQL supabase/ops/nelo_synthetic_reset.sql sha256=cba732e932c1`, `ROW campaign_offers=0 campaign_imports=0 media_objects=0 links=0 campaign_not_reset=0`, `APPLIED`.
- `SCAN objects=0 metadata=0 location=0 no-row=0 no-object=0`. No `REMOVED` line.
- Gate read after: `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6` and `ROW drift=0 campaign_offers=0 not_synthetic=0 switched_off=0 media_objects=0 orphans=0`.
- `report.mjs --check` exited 0. The secret sweep printed nothing. `git diff --name-only` from LANDING to HEAD printed nothing before this entry. CI is not attested.
- Deviation: earlier gate reads were not all zero (`campaign_offers=7 not_synthetic=1 media_objects=5`, then `campaign_offers=0 media_objects=1 orphans=0`). The reset was not run until this all-zero read.
- Deviation: one anonymous `ls-remote` during the resume could not resolve github.com (exit 128, `api status=000`). The step 1 check before this reset exited 0 with `api status=200`.

## 2026-10-29 — Reviewer session 12 (go-live 1 verdict, the empty-contacts crash)

- Fetched `go-live-1` at `5fea78c` (PR #9). Compared the ledger changes, the journal entries and the
  usage record with the fence (exact); only the four ledger files changed. The runner and the scan
  show the project empty: the gate read all zero before and after the reset, the reset's row all
  zero, `SCAN objects=0`. CI success on `5fea78c` read from GitHub.
- Verdict go-live 1: PASS.
- The human then saw React error 441 and a Content Security Policy message on the Vercel address.
  Cause, read in the code: `readCampaignRow` refuses the empty contact values the reset leaves, so
  every public page throws and Next.js shows its built-in error page, whose inline style the policy
  blocks. T05-F3 issued (CF-38). Before the reset the human removed a leftover MediaObject (the
  banner); the scan confirms nothing is left in R2.

## 2026-10-29 — T05-F3 (builder)

- LANDING `9d021e4afbf96eba1b6eb14e2af3d886cb845113`. Carry-forwards `38 11 ['39']`: 37 + 1 = 38 rows, next free 39, open 10 + 1 = 11. CF-38 is the id allocated for this landing and stays `OPEN`.
- Ids: `9d021e4afbf96eba1b6eb14e2af3d886cb845113` bundle, carry-forward row, go-live 1 verdict entry and usage records; `b6af5fe86672941472d6fae2d2fe385be15d92c2` empty contact values, error state and the unit spec.
- Campaign read: `SQL supabase/checks/nelo_campaign_read.sql sha256=53805174d67c` and `ROW campaign_rows=1 campaign_row_1=1 published=1 contacts_empty=0`.
- `readCampaignRow` turns a null WhatsApp display, WhatsApp digits, hotline display, hotline dial or NEL link into `""` and still halts on any other non-string. `src/app/[locale]/error.tsx` uses the URL locale, or the default locale when the param is not one of ours. `src/app/global-error.tsx` has its own document, `lang` and `dir` for the default locale, both languages with Arabic first. Both show `site.errorMessage`, a `site.tryAgain` button that calls `reset`, and the link home, with theme classes only.
- The live spec did not run, because the Campaign read printed `contacts_empty=0`. No screenshots.
- On `b6af5fe86672941472d6fae2d2fe385be15d92c2`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 39 passed. The secret sweep printed nothing. Tracked count 0. The diff from LANDING for earlier evidence, `docs/DESIGN_SYSTEM.md`, `supabase/`, `scripts/`, `package.json` and `package-lock.json` is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). No dependency was added. CI is not attested.
- Deviation: the first Campaign read, before this resume, printed `CONNECT FAILED ETIMEDOUT` and was not retried. This resume's single read is the line above.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.

## 2026-10-29 — Reviewer session 13 (T05-F3 verdict, OD-05)

- Fetched `t05-f3-contacts` at `344cf9f` (PR #10). Verified the bundle (2/2 at LANDING and HEAD),
  compared the carry-forward row, the journal entries and the usage records with the fence (exact),
  and re-ran the four guards, lint, typecheck and the unit specs (39). Read `readCampaignRow` (only
  the five contact columns changed) and the two error states (theme classes, no inline style). The
  Campaign read through the runner: one row, published, contact values set. CI success on `344cf9f`
  read from GitHub.
- Verdict T05-F3: PASS. CF-38 closes. CF-39 records the error page's missing left-to-right isolation.
- The human relayed the designer's changes, signed as OD-05. The human's screenshot shows a synthetic
  CampaignOffer visible on the live project (CF-40). T06 issued.

## 2026-10-29 — T06 (builder)

- LANDING `06510e3c43957fe3bb61f5bb3debcce90d3dbabd`. Bundle `T06 BUNDLE PASS 5 / 5 []` at LANDING and at HEAD. Carry-forwards `40 12 ['41']`: 38 + 2 = 40 rows, next free 41, open 11 − 1 + 2 = 12. CF-38 is `CLOSED (T05-F3)`. CF-39 and CF-40 hold the landed rows and stay `OPEN`.
- Ids: `06510e3c43957fe3bb61f5bb3debcce90d3dbabd` OD-05, carry-forward changes, T05-F3 verdict entry and usage records; `c553dc73b352a777c5a85602ade38a4adf538af3` the designer's changes, polish, specs and evidence.
- On `c553dc73b352a777c5a85602ade38a4adf538af3`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 39 passed. The secret sweep printed nothing. Tracked count 0. The diff from LANDING for T01–T05-F2 evidence, the five bundle files, `supabase/`, `scripts/sql/`, `package.json` and `package-lock.json` is empty. `scripts/usage/record.mjs` differs from `main` only in `T0[1-6]`.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). No dependency was added.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 28 passed. `stale-confirm 367ms`. `preview-picture 24,251 342x342 viewport 390x844`. `preview-picture 294,24 852x852 viewport 1440x900`.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6` and `ROW drift=0 campaign_offers=6 not_synthetic=0 switched_off=0 media_objects=5 orphans=0`. The campaign is unpublished and every CampaignOffer is shown. CI is not attested.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: `NEXT_PUBLIC_SITE_URL` is unset, so the running build warns that `metadataBase` falls back to `http://localhost:3000`.
- Deviation: the suite rewrote `docs/evidence/T05` and `docs/evidence/T05-F2`. Those bytes were restored before the implementation commit, so those folders are unchanged.
- Deviation: the campaign was already published when the specs started (CF-40). The campaign spec confirms the coming-soon dialog first in that case, then reads the publish dialog, and still leaves the campaign unpublished.

## 2026-10-29 — Reviewer session 14 (T06 verdict)

- Fetched `t06-designer-changes` at `2400ecf` (PR #11). Verified the bundle (5/5 at LANDING and
  HEAD), compared the carry-forward changes, the journal entries and the usage records with the
  fence (exact); `record.mjs` differs from `main` only in `T0[1-6]`; nothing under `supabase/`,
  `scripts/sql/`, the dependencies or earlier evidence changed. Re-ran the four guards, lint,
  typecheck and the unit specs (39). Read the dialog centring, the red remove classes, the import
  catch and the error page's isolation. Viewed the eight screenshots. CI success on `2400ecf` read
  from GitHub.
- Findings: the slot tiles are circles and reach about 210 px at 1440 (the spec named no size); on
  touch screens their Replace and Remove are invisible yet tappable; the floating header is wider
  than the content and touches it; one screenshot caught the library's fade-in.
- Verdict T06: FAIL. T06-F issued with `ADMIN_SPEC.md` §10 and `DESIGN_SYSTEM.md` §11.1 amended.
  CF-37 and CF-39 close: the import panel recovers from a non-JSON answer and the error page isolates
  its English runs.

## 2026-10-29 — T06-F (builder)

- LANDING `460a9390e34ccbe9bcaa904b0c4ae85ce817ae15`. Bundle `T06F BUNDLE PASS 2 / 2 []` at LANDING and at HEAD. Carry-forwards `42 12 ['43']`: 40 + 2 = 42 rows, next free 43, open 12 − 2 + 2 = 12. CF-37 and CF-39 are `CLOSED (T06)`. CF-41 and CF-42 hold the landed rows and stay `OPEN`.
- Ids: `460a9390e34ccbe9bcaa904b0c4ae85ce817ae15` amendments, carry-forward changes, T06 verdict entry and usage record; `e25e484e9cd6d7c7bfc1e9249bc7fcdb05a0d975` square tiles, touch controls, header alignment and evidence; `4e4b4d8d962b3a1f34b4f93afe1516a1f64bfbb6` the screenshot helper's parameter renamed after the naming guard; `6d40b4f72e2775500104bfb582192259321f3212` the confirmation screenshot from the passing suite.
- On `6d40b4f72e2775500104bfb582192259321f3212`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 39 passed. The secret sweep printed nothing. Tracked count 0. The diff from LANDING for T01–T05-F2 evidence, `docs/ADMIN_SPEC.md`, `docs/DESIGN_SYSTEM.md`, `supabase/`, `scripts/`, `package.json` and `package-lock.json` is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). No dependency was added.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 28 passed. Tile width 47.59375 at 320, 61.59375 at 390, 88 at 1440, in both locales. `stale-confirm 411ms`. `preview-picture 24,251 342x342 viewport 390x844`. `preview-picture 294,24 852x852 viewport 1440x900`.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6` and `ROW drift=0 campaign_offers=6 not_synthetic=0 switched_off=0 media_objects=5 orphans=0`. The campaign is unpublished and every CampaignOffer is shown. CI is not attested.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: `NEXT_PUBLIC_SITE_URL` is unset, so the running build warns that `metadataBase` falls back to `http://localhost:3000`.
- Deviation: the suite rewrote `docs/evidence/T05` and `docs/evidence/T05-F2`. Those bytes were restored before the evidence commit, so those folders are unchanged.
- Deviation: the naming guard rejected `filePath` in the screenshot helper. The parameter is `shotPath`. The checks above are the run after that rename.
- Deviation: one `npx playwright test` waited out on the import preview and was not given a timeout of its own. The following run is the 28 passed line above.

## 2026-10-29 — Reviewer session 15 (T06-F verdict)

- Fetched `t06-designer-changes` at `b98f1dd` (PR #11). Verified the bundle (2/2 at LANDING and
  HEAD), compared the carry-forward changes, the journal entries and the usage record with the fence
  (exact), and re-ran the four guards, lint, typecheck and the unit specs (39). Read the tile grid
  (12 px corners, at most 88 px), the hover and touch rules and the header classes, and viewed the
  nine screenshots. CI success on `b98f1dd` read from GitHub.
- The tiles are square and at most 88 px; touch screens show Replace and Remove; the library rows
  are drawn in full. CF-41 closes.
- Findings: at 390 px the card's names and chips are squeezed into a column a few characters wide;
  the public header is still wider than the hero card. Verdict T06-F: FAIL. T06-F2 issued with
  `ADMIN_SPEC.md` §10 and `DESIGN_SYSTEM.md` §11.1 amended; CF-42 stays open for the header.

## 2026-10-29 — T06-F2 (builder)

- LANDING `c5a25433dfb020975466862d8f6c556e0bc679dc`. Bundle `T06F2 BUNDLE PASS 2 / 2 []` at LANDING and at HEAD. Carry-forwards `43 12 ['44']`: 42 + 1 = 43 rows, next free 44, open 12 − 1 + 1 = 12. CF-41 is `CLOSED (T06-F)`. CF-43 holds the landed row and stays `OPEN`. CF-42 stays `OPEN`.
- Ids: `c5a25433dfb020975466862d8f6c556e0bc679dc` amendments, carry-forward changes, T06-F verdict entry and usage record; `5f473ccfc01f3c9f78b3c6f188f06f40086c4b63` readable card head, header edges and evidence.
- On `5f473ccfc01f3c9f78b3c6f188f06f40086c4b63`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 39 passed. The secret sweep printed nothing. Tracked count 0. The diff from LANDING for T01–T05-F2 evidence, `docs/ADMIN_SPEC.md`, `docs/DESIGN_SYSTEM.md`, `supabase/`, `scripts/`, `package.json` and `package-lock.json` is empty.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). No dependency was added.
- `npm run check:r2`: PUT 200. HEAD 200 16 image/webp. GET 200 16 equal. DELETE 204. HEAD 404.
- `npx playwright test`: 28 passed. Names' column width 186 at 320 and 256 at 390, in both locales. Tile width 47.59375 at 320, 61.59375 at 390, 88 at 1440. `stale-confirm 361ms`. `preview-picture 24,251 342x342 viewport 390x844`. `preview-picture 294,24 852x852 viewport 1440x900`.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6` and `ROW drift=0 campaign_offers=6 not_synthetic=0 switched_off=0 media_objects=5 orphans=0`. The campaign is unpublished and every CampaignOffer is shown. CI is not attested.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: `NEXT_PUBLIC_SITE_URL` is unset, so the running build warns that `metadataBase` falls back to `http://localhost:3000`.
- Deviation: the suite rewrote `docs/evidence/T05`, `docs/evidence/T05-F2`, `docs/evidence/T06/campaign-offer-ar-390.png` and `docs/evidence/T06/confirm-remove-ar-390.png`. Those bytes were restored before the implementation commit, so those files are unchanged.
- Deviation: one `npx playwright test` waited out on the import preview and was not given a timeout of its own. The following run is the 28 passed line above.

## 2026-10-30 — Reviewer sessions 16 and 17 (T06-F2 verdict, T07)

- 29 Oct: fetched `t06-designer-changes` at `a23c1ff` (PR #11). Verified the bundle (2/2 at
  LANDING and HEAD), compared the carry-forward changes, the journal entries and the usage record
  with the fence (exact), and re-ran the four guards, lint, typecheck and the unit specs (39).
  Viewed the four screenshots: the card head readable at 390 in both locales, the header on the
  hero card's edges at 1440. CI success on `a23c1ff` read from GitHub. Verdict T06-F2: PASS; with
  T06-F, T06 passes. CF-42 and CF-43 close. Go-live 2 was issued and did not run.
- 30 Oct: the laboratory's real sheet is in the project. Andrew asked for "اضغط هنا" on the cards
  and for no code in front of Visitors; the human signed OD-06 (the code stays the sheet's key and
  the dashboard's identifier). New precedent: no build fence writes to the project. New
  carry-forward: no staging project for the end-to-end specs. T07 issued, rehearsed on a clean
  clone of `83ef91f` (landing counts, the four guards, lint, typecheck, 43 unit specs, build).

## 2026-10-30 — T07 (builder)

- LANDING `3467f3621a49a1f64c4805c62b445258cafd3eb4`. Bundle `T07 BUNDLE PASS 6 / 6 []` at LANDING and at HEAD. Carry-forwards `44 11 ['45']`: 43 + 1 = 44 rows, next free 45, open 12 − 2 + 1 = 11. CF-42 and CF-43 are `CLOSED (T06-F2)`. CF-44 holds the landed row and stays `OPEN`. Precedents `33 ['34']`: 32 + 1 = 33 rows, next free 34. PR-33 is the production-data row.
- Ids: `3467f3621a49a1f64c4805c62b445258cafd3eb4` OD-06 and amendments, ledger changes, reviewer entry and usage records; `9e6b42026d3f262faf0e108ec936806830067d09` no code for Visitors, call to action on the cards.
- On `9e6b42026d3f262faf0e108ec936806830067d09`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 43 passed. Both `git grep` lines printed nothing. The secret sweep printed nothing. Tracked count 0. The diff from LANDING for `docs/`, `supabase/`, `scripts/`, `package.json` and `package-lock.json` is empty. `scripts/usage/record.mjs` differs from `main` only in `T0[1-7]`.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). No dependency was added. No Playwright spec, `check:r2` or Operator action ran.
- `SCAN objects=1 metadata=0 location=0 no-row=0 no-object=0`. Gate row: `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6` and `ROW drift=0 campaign_offers=47 not_synthetic=47 switched_off=0 media_objects=1 orphans=0`. Drift is 0. The other counts are the laboratory's data and are reported as read (CF-40). CI is not attested.
- Eight screenshots of the public home page and the first card's page, at 390 and 1440 in both locales, were written outside the repository. The campaign is published. The cards show the action pill. The pages do not show a code.
- Deviation: the first anonymous visibility check exited 128 and the API returned 404. The human asked for the check again. The second check exited 0 with `api status=200`.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: the first `npm run build` failed typecheck on the card spec's name map. The map became a function before the implementation commit. The build line above is the run that exited 0.
- Deviation: `npx playwright screenshot` had no browser binary. `npx playwright install chromium` downloaded one. No dependency was added. The eight screenshots are the run after that download.

## 2026-10-30 — Reviewer session 17 (T07 verdict, T08)

- Fetched `t07-no-visible-code` at `367ddaf` (PR #12). Verified the bundle (6/6 at LANDING and
  HEAD), compared the ledger changes, the journal entries and the usage records with the fence
  (exact), re-ran the four guards, lint, typecheck, the unit specs (43) and the build, read the
  diff, and viewed the eight screenshots: no code on any card or page, the "اضغط هنا" pill on all
  47 cards in both locales. The builder's gate read: drift 0, 47 CampaignOffers, all the
  laboratory's. Verdict T07: PASS; PR #12 merged.
- Logged: the live contact texts read "hotline" and "WhatsApp"; rows 30 and 31 are both "anti
  phospholipid IgM"; long names are cut after two lines at desktop width.
- After the merge the human found the laboratory's first video cropped on its page: the designer's
  16:10 frame uses `object-cover`. OD-07 signed; T08 issued, rehearsed on a clean clone of
  `74f971d` (landing counts, the four guards, lint, typecheck, 43 unit specs, build, and a tall
  and a wide test video drawn with the built styles).

## 2026-10-30 — T08 (builder)

- LANDING `38bc9f6960dbc96aed580a7b368f9529ae3c085c`. Bundle `T08 BUNDLE PASS 4 / 4 []` at LANDING and at HEAD. Carry-forwards `47 14 ['48']`: 44 + 3 = 47 rows, next free 48, open 11 + 3 = 14. CF-45, CF-46 and CF-47 hold the landed rows and stay `OPEN`.
- Ids: `38bc9f6960dbc96aed580a7b368f9529ae3c085c` OD-07 and amendments, carry-forward rows, reviewer entry and usage records; `e8f6ab96208da1b386beaa898bbf4713e626b495` the whole frame of the main video and image.
- On `e8f6ab96208da1b386beaa898bbf4713e626b495`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 43 passed. `git diff --name-only` from LANDING printed only `src/components/public/main-media-object.tsx`. The secret sweep printed nothing. Tracked count 0. `scripts/usage/record.mjs` differs from `main` only in `T0[1-8]`.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (2 moderate, none high). No dependency was added. No Playwright spec, `check:r2` or Operator action ran.
- `SCAN objects=5 metadata=0 location=0 no-row=0 no-object=0`. Gate row: `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6` and `ROW drift=0 campaign_offers=47 not_synthetic=47 switched_off=0 media_objects=5 orphans=0`. Drift is 0. The other counts are the laboratory's data and are reported as read. CI is not attested.
- Four screenshots of the one public CampaignOffer page that contains a video, at 390 and 1440 in both locales, were written outside the repository. The handoff left the code as a placeholder; that page was read from the local build. The video is shown whole, with the soft fill beside it where the picture is narrower than the column.
- Deviation: the first anonymous visibility check exited 128 and the API returned 404. The human asked for the check again. The second check exited 0 with `api status=200`.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.

## 2026-10-31 — Reviewer sessions 17 and 18 (T08 verdict, T09)

- 30 Oct: fetched `t08-whole-frame` at `9618963` (PR #13). Verified the bundle (4/4 at LANDING and
  HEAD), compared the carry-forward rows, the journal entries and the usage records with the fence
  (exact), re-ran the four guards, lint, typecheck, the unit specs (43) and the build, and viewed
  the four screenshots: the laboratory's tall video whole at 390 and 1440 in both locales.
  Verdict T08: PASS; PR #13 merged. CF-47 closes.
- 31 Oct: the human asked that the campaign banner may be a video, with nothing in the database
  or the uploads lost. OD-08 signed. The reviewer authored
  `20261031000000_nelo_banner_video.sql` (two functions replaced in place) and its rolled-back
  proof, and rehearsed both on PostgreSQL 16 with every migration and a live image banner:
  APPLIED, proof PASS 13/13, the banner and every row unchanged, grants unchanged, a second run
  harmless. T09 issued, rehearsed on a clean clone of `824b030` (landing counts, the four guards,
  lint, typecheck, 45 unit specs, build).

## 2026-10-31 — T09 (builder)

- LANDING `dbe0026cacec5d6dc05b766102f71fce1d777c54`. Bundle `T09 BUNDLE PASS 9 / 9 []` at LANDING and at HEAD. Carry-forwards `47 13 ['48']`: 47 rows, next free 48, open 14 − 1 = 13. CF-47 reads `CLOSED (T08)` and no other cell changed.
- Ids: `dbe0026cacec5d6dc05b766102f71fce1d777c54` OD-08, the amendments, the migration and its proof, CF-47 closure, reviewer entry and usage records; `5b61c722ba002b9d4086e8003e03e1c6a2a5168a` the campaign banner may be a video.
- Step 4, before the halt:
  `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6`
  `ROW drift=0 campaign_offers=47 not_synthetic=47 switched_off=14 media_objects=60 orphans=0`
  `SCAN objects=60 metadata=0 location=0 no-row=0 no-object=1`
  `SQL supabase/migrations/20261031000000_nelo_banner_video.sql sha256=bab09de47f52`
  `APPLIED`
  `SQL supabase/checks/nelo_rls_proof_banner_video.sql sha256=290d23905c03`
  `RAISED BANNER VIDEO PROOF (rolled back): PASS 13/13`
  `SQL supabase/checks/nelo_gate_read.sql sha256=d49b4c86eba6`
  `ROW drift=0 campaign_offers=47 not_synthetic=47 switched_off=14 media_objects=61 orphans=0`
  `SCAN objects=61 metadata=0 location=0 no-row=0 no-object=3`
- H6: the gate row and the scan after the migration were not identical to the ones before, so the banner code was not started. The human then resumed: the dashboard stays in use, and the differences are uploads made in the live dashboard during step 4. `media_objects` and `objects` went 60 → 61. `no-object` 1 → 3 is the scan listing R2 first and reading the rows afterwards. Both gate rows show drift 0 and orphans 0. Both scans show `metadata=0 location=0`. The migration was not run again. No SQL and no scan after the resume.
- On `5b61c722ba002b9d4086e8003e03e1c6a2a5168a`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 45 passed. `git diff --name-only` from LANDING printed only files under `src/`. The secret sweep printed nothing. Tracked count 0. `scripts/usage/record.mjs` differs from `main` only in `T0[1-9]`.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (9 moderate, none high). No dependency was added. No Playwright spec, `check:r2` or Operator action ran.
- Four screenshots of the home page, at 390 and 1440 in both locales, were written outside the repository. The hero shows the current image banner.
- Deviation: the first anonymous visibility check exited 128 and the API returned 404. The human asked for the check again. The second check exited 0 with `api status=200`.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: the first `npm run build` failed typecheck (`Blob` has no `name`; the banner kind was widened to `string`). The chosen file is a `File`, and `readBannerKey` now returns `"image" | "video"`. The build line above is the run that exited 0.

## 2026-10-31 — Reviewer session 18 (T09 verdict, T10)

- Fetched `t09-banner-video` at `2dafc54` (PR #14). Verified the bundle (9/9 at LANDING and HEAD),
  the CF-47 closure, the journal entries and the usage records against the fence (exact), re-ran
  the four guards, lint, typecheck, the unit specs (45) and the build, compared the code with the
  reviewer's rehearsal file by file, and viewed the four screenshots (the image banner unchanged).
  Step 4: migration APPLIED, proof PASS 13/13; H6 stopped the fence because an Operator uploaded
  a file during step 4 (60 → 61) and the scan's own timing (no-object 1 → 3); resumed without
  further SQL. Verdict T09: PASS; PR #14 merged.
- The human asked that the banner video always play: OD-09 signed after the reviewer's question
  and the reviewer's note on WCAG 2.2.2 and reduced motion. T10 issued, rehearsed on a clean
  clone of `b7a13f3` (landing counts, the four guards, lint, typecheck, 46 unit specs, build).

## 2026-10-31 — T10 (builder)

- LANDING `750814b8ec1fbe943e42e499604a601153c45260`. Bundle `T10 BUNDLE PASS 4 / 4 []` at LANDING and at HEAD. Carry-forwards `49 15 ['50']`: 47 + 2 = 49 rows, next free 50, open 13 + 2 = 15. CF-48 and CF-49 hold the landed rows and stay `OPEN`. No existing cell changed.
- Ids: `750814b8ec1fbe943e42e499604a601153c45260` OD-09 and amendments, carry-forward rows, reviewer entry and usage records; `65bb620efb1e96a7a94eca24d387a63d892a165b` the banner video always plays.
- On `65bb620efb1e96a7a94eca24d387a63d892a165b`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 46 passed. `git grep` for `pauseBanner|playBanner` under `src` printed nothing. `git diff --name-only` from LANDING printed only files under `src/`. The secret sweep printed nothing. Tracked count 0. `scripts/usage/record.mjs` differs from `main` only in the task pattern.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (9 moderate, none high). No dependency was added. No SQL, scan, Playwright spec or Operator action ran.
- Two screenshots of the home page, Arabic at 390 and English at 1440, were written outside the repository. The hero shows the live banner, which is still an image.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
- Deviation: the first `npm run build` failed typecheck because the video element looked nullable inside the effect. It is bound after the null check. The build line above is the run that exited 0.

## 2026-10-31 — Reviewer session 18 (T10 verdict, T11)

- Fetched `t10-banner-always` at `96e108c` (PR #15). Verified the bundle (4/4 at LANDING and
  HEAD), CF-48 and CF-49, the journal entries and the usage records against the fence (exact),
  re-ran the four guards, lint, typecheck, the unit specs (46) and the build, read the new banner
  component, and viewed the two screenshots. Verdict T10: PASS; PR #15 merged. CF-49 closes.
- The human then found the banner blank on real phones. The reviewer read the live page (the
  video tag carries autoplay, muted, loop and playsinline), the live banner's file (first a
  fragmented MP4, then a standard one, both H.264), the storage's range answers (206, as an iPhone
  asks), and loaded the page in phone emulation under the strictest autoplay policies (playing).
  The human's checks closed it: the iPhone had "Auto-Play Video Previews" off, and a W3Schools
  autoplay example also needed a tap there. OD-10 signed; T11 issued, rehearsed on a clean clone
  of `e6e9eda` (landing counts, the four guards, lint, typecheck, 46 unit specs, build).

## 2026-10-31 — T11 (builder)

- LANDING `5ad2ab38e74c0a637e0f2e9dc48ca32cf421564d`. Bundle `T11 BUNDLE PASS 4 / 4 []` at LANDING. Carry-forwards `50 15 ['51']`: 49 + 1 = 50 rows, next free 51, open 15 − 1 + 1 = 15. CF-49's status cell is `CLOSED (T10)`. CF-50 holds the landed row and stays `OPEN`. No other cell changed.
- Ids: `5ad2ab38e74c0a637e0f2e9dc48ca32cf421564d` OD-10 and amendments, carry-forward changes, reviewer entry and usage records; `0e4fe506fc1b2716e5e12a5ee1e61ba1288573c1` a banner the phone holds back.
- On `0e4fe506fc1b2716e5e12a5ee1e61ba1288573c1`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 46 passed. `git diff --name-only` from LANDING printed only files under `src/`. The secret sweep printed nothing. Tracked count 0.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (9 moderate, none high). No dependency was added. No SQL, scan, Playwright spec or Operator action ran.
- Two screenshots of the home page, Arabic at 390 and English at 1440, were written outside the repository. The hero shows the live banner, which is a still image.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.

## 2026-10-31 — Reviewer session 18 (T11 verdict, T11-F)

- Fetched `t11-banner-held` at `73d7b4e` (PR #16). Verified the bundle (4/4 at LANDING and HEAD),
  the carry-forward file and the usage records against the reviewer's rehearsal (identical), the
  journal entries, re-ran the four guards, lint, typecheck, the unit specs (46) and the build, read
  the banner component (equivalent to the rehearsal), and viewed the two screenshots. CI success
  on `73d7b4e` read from the human's message. Verdict T11: PASS. CF-50 closes.
- Before the merge the human asked that the WhatsApp link text read "عروض — معامل النيل مصر":
  OD-11 signed; T11-F issued on the same branch, rehearsed (the four guards, lint, typecheck,
  46 unit specs, build).

## 2026-10-31 — T11-F (builder)

- LANDING `4e425951bf25db334533b847342f3527d9594e7e`. Bundle `T11F BUNDLE PASS 2 / 2 []` at LANDING. Carry-forwards `50 14 ['51']`: 50 rows, next free 51, open 15 − 1 = 14. CF-50's status cell is `CLOSED (T11)`. No other cell changed.
- Ids: `4e425951bf25db334533b847342f3527d9594e7e` OD-11, CF-50 closure, reviewer entry and usage records; `2ef547a2eb9639aa5d0d805371144f2a9736a8ca` the campaign title is عروض.
- On `2ef547a2eb9639aa5d0d805371144f2a9736a8ca`, `git status --porcelain` was empty. All four guards exited 0. Self-checks: naming string fail 5/5 pass 7/7, file fail 5/5 pass 7/7; design string fail 9/9 pass 6/6, file fail 9/9 pass 6/6; literals string fail 7/7 pass 3/3, file fail 7/7 pass 3/3; boundary string fail 4/4 pass 4/4, file fail 4/4 pass 4/4. `report.mjs --check` exited 0. Lint exited 0. Typecheck exited 0. Unit tests: 46 passed. `git diff --name-only` from LANDING printed only `src/i18n/ar.ts` and `src/i18n/en.ts`. The secret sweep printed nothing. Tracked count 0.
- `npm run build` exited 0. `npm audit --omit=dev --audit-level=high` exited 0 (9 moderate, none high). No dependency was added. No SQL, scan, Playwright spec or Operator action ran.
- Titles from the local production build: `'\u0639\u0631\u0648\u0636 \u2014 \u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u0646\u064a\u0644 \u0645\u0635\u0631'` and `'<meta property="og:title" content="\u0639\u0631\u0648\u0636 \u2014 \u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u0646\u064a\u0644 \u0645\u0635\u0631"/>'`; `'Offers \u2014 Nile Egypt Labs'` and `'<meta property="og:title" content="Offers \u2014 Nile Egypt Labs"/>'`.
- Deviation: the first step 2 found no zip and `git status --porcelain` printed nothing, so the task halted (H3). The human asked to check again. The zip was then untracked, with the expected hash and length.
- Deviation: `npm run build` warns that a lockfile outside this repository was ignored, and exits 0.
- Deviation: `npm run test:unit` warns that `vitest.config.ts` is loaded as CommonJS and exits 0.
