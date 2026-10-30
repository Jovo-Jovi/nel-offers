# NELO — Phases

Eight tasks, four gates (T05 added by OD-04, T06 by OD-05, T07 by OD-06, T08 by OD-07). One task per branch; a task starts only when the previous
one is pushed and verified. The reviewer ticks a task at its verdict; a halted task is never
ticked.

## 1. Map

| Phase | Task | Branch | Risk | Review gate | Gate | Non-waivable / acceptance checks | Target |
|---|---|---|---|---|---|---|---|
| P00 Prepare | — | — | — | — | **G0** OD-01 signed | — | 28 Oct |
| P01 Foundation | **T01** | `t01-foundation` | 2 | reviewer only | **G1** | Boundary (public tree) · Bilingual | 29 Oct, morning |
| P02 Data, sign-in, storage | **T02** | `t02-data-auth-storage` | 3 | waived by the human (OD-02) | **G2** | Boundary (schema, routes, bucket) | 29 Oct, afternoon |
| P03 Operator dashboard | **T03** | `t03-dashboard` | 3 | waived by the human (OD-02) | **G3** | Boundary · Offer content (synthetic) · Data integrity · Bilingual | 30 Oct, morning |
| P04 Public site and go-live | **T04** | `t04-public-golive` | 2 (DNS: OD-01 item 18) | reviewer only | **G4** launch | Offer content (real) · Boundary · Data integrity · Bilingual | 30 Oct, afternoon |
| P04 Public site and go-live | **T05** | `t05-operator-controls` | 3 | waived by the human (OD-02) | before G4 | Boundary · Offer content (synthetic) · Data integrity · Bilingual | 30 Oct, morning |
| P04 Public site and go-live | **T06** | `t06-designer-changes` | 2 | reviewer only | before G4 | Bilingual · Data integrity | 30 Oct, morning |

"Reviewer only" on a Risk-2 task becomes "Sonnet review before merge" when the human asks.

## 2. Tasks

- [x] **T01 — Foundation and blueprint landing.** Land the reviewer bundle byte-exact
  (blueprint, ledgers with ids allocated, tokens, mark, template, verifier). Scaffold Next.js
  16 with TypeScript strict, Tailwind 4, ESLint. Locale routing and catalogues; `<html lang
  dir data-locale>` from the locale; the coming-soon home in both locales (no data source yet).
  Font package, tokens wired through `@theme inline`, the mark in the header. The four guards
  with `--self-check`. CI. `.gitattributes`, `.env.example`. Rendered evidence at both widths in
  both locales.
- [x] **T02 — Data, Operator sign-in, storage, headers.** Reviewer-authored migration (tables,
  constraints, triggers, visibility and drift functions, `is_operator()`, RLS, the import
  apply function), applied by the human. Supabase clients (publishable key only). Operator
  sign-in, TOTP enrolment and verification, `aal2` enforcement. R2 presign and finalise route
  handlers; server-side presigning of view links. Security headers with nonce CSP. Vercel project with environment values set by the
  human; R2 CORS applied by the human. Boundary evidence for schema, routes and bucket.
- [x] **T03 — Operator dashboard** (with its fix task T03-F). The approved theme and font for the whole application
  (OD-02 item 3). Migration 2 (card price switch, campaign banner). Overview, CampaignOffers list
  with Remove, template download, export, import with preview and confirm, media-object bulk
  upload with the media edge controls, Campaign settings with the price switch and the banner,
  publish switch, skeletons and motion (OD-02 items 4, 10). Unit specs for the parser and the name
  rules; end-to-end specs on synthetic sheets and media; the round-trip property; the offer
  content check on synthetic data; `scan:media-objects`.
- [x] **T04 — Public site from the approved design** (with its fix tasks T04-F and T04-F2). Home and CampaignOffer page reproduced
  from the approved design (`DESIGN_SYSTEM.md` §§11–11.1) and wired to data: banner hero, search,
  cards with the price switch, main media, gallery preview, end-date boxes, actions, localized
  not-found and coming-soon states, skeletons, no overflow from 320 px. Rendered evidence and
  end-to-end specs in both locales and widths; the offer content check on the rendered pages. Then
  §4 with the human.
- [x] **T05 — Operator controls, media choice, dashboard v2, link previews** (OD-04; with T05-F, T05-F2, T05-F3). The SQL
  runner; migration 5 (show switch, remove one slot) applied and proved through it; the media page
  with Videos and Images tabs, choice of CampaignOffer and slot, and the library; dashboard v2
  (`ADMIN_SPEC.md` §10); link previews, icons, the video's first frame, the preview's margin;
  `README.md`. Specs and evidence in both locales and widths.
- [x] **T06 — The designer's changes** (OD-05; with T06-F and T06-F2). Floating pill header, no thumbnail captions,
  CampaignOffer card v3, slot names, the publish switch's size, red removals and centred dialogs, the
  library by type; with the Import-page and error-page polish (CF-37, CF-39).
- [x] **T07 — No code for Visitors, "اضغط هنا" on the cards** (OD-06). Cards, the CampaignOffer
  page, the subtitle, the link preview and the WhatsApp order message without the code; the card's
  call to action. Checked by unit specs and a read-only look at the public pages: the project holds
  the laboratory's real data, and no build fence writes to it (`PRECEDENTS.md`, "Production data").
- [ ] **T08 — The whole frame of the main video and image** (OD-07). The CampaignOffer page shows
  the main video or image uncropped, in its own shape, up to 75% of the screen's height. Checked by
  the guards, a build and a read-only look at the page that holds the laboratory's video.

## 3. Gate evidence

| Gate | Must show |
|---|---|
| G1 | The verifier PASS on the committed bytes; guards and `--self-check` outputs; lint, typecheck, build; four screenshots; zero cookies and no off-origin request on public pages; the remote comparison line. |
| G2 | The migration's committed hash equal to the rehearsed hash; human-attested column inventory; RLS proofs (anon cannot read hidden rows or write anything; `aal1` cannot read Operator data); presign refusal cases; header dump; bucket privacy human-attested. |
| G3 | Unit and end-to-end specs; `campaign_offer_drift()` = 0 and the `CampaignOffer` count, human-attested; round-trip zero changes; `scan:media-objects` zero hits; orphan `MediaObject` count zero; dashboard screenshots in both locales. |
| G4 | Everything in G1–G3 re-run on production with the real sheet and media; §4 complete. |

## 4. Go-live list (with the human)

Each step is done and attested before the next. The reviewer checks the evidence of steps 2, 3, 5
and 8.

1. **Vercel connection.** Vercel's GitHub app can see the repository and the project deploys
   `main` (CF-17). The human records the Hobby or Pro decision (CF-18).
2. **Staging on the Vercel address.** `NEXT_PUBLIC_SITE_URL` is the project's `https://….vercel.app`
   address; the Supabase Auth site URL and redirect list and the R2 CORS origins include it. On that
   address, with the synthetic data: sign-in with TOTP, an import, an upload, the publish switch,
   and the public home and CampaignOffer pages on a phone. Screenshots and a header dump from that
   address go to the reviewer.
3. **Synthetic data out.** Every synthetic `CampaignOffer` and the synthetic banner removed through
   the dashboard; then `supabase/ops/nelo_synthetic_reset.sql` in the SQL Editor. Its result row
   reads zero for every count, the campaign unpublished and no contact value set, human-attested.
4. **Real Operators.** The laboratory's Operator accounts created and enrolled (`ADMIN_SPEC.md` §9;
   CF-10).
5. **Real content.** An Operator imports the laboratory's real sheet and uploads its media (CF-05,
   CF-06). `campaign_offer_drift()` returns zero rows; `scan:media-objects` reports zero hits; the
   orphan count is zero.
6. **Contacts and copy.** Contact values and the NEL site address entered and tried from the
   settings page (CF-07, CF-08); copy confirmed by Andrew, or the open drafts listed in the verdict
   (CF-03).
7. **Domain.** Vercel: `offers.nileegyptlabs.com` added to the project; GoDaddy: one CNAME record
   `offers` to the target Vercel names (CF-09); Vercel verifies; the certificate is served.
   `NEXT_PUBLIC_SITE_URL`, the R2 CORS origins and the Supabase Auth site URL point at the
   production address.
8. **Publish.** An Operator switches the campaign on. Production screenshots, both locales, both
   widths; G4 re-run.
9. **Close-out.** The spec account removed from Supabase Auth and its `E2E_` values deleted from
   `.env.local`. The database password reset in Supabase, and `SUPABASE_DB_URL` and
   `SUPABASE_DB_CA` deleted from `.env.local` (OD-04 item 1). The repository made private again (OD-01 item 2; CF-01): an anonymous
   `git ls-remote` fails and the unauthenticated API answers 404.

## 5. Usage ledger

Every agent run of the project is one line in `docs/usage/runs.jsonl`, appended by
`npm run usage:record` (`scripts/usage/record.mjs`) and totalled by `npm run usage:report`
(`scripts/usage/report.mjs`) into `docs/usage/README.md`. Neither file is ever edited by hand:
the record script only appends, and the report is regenerated whole.

**Who reports what.** A run's figures come from the tool that ran it, never from an estimate.

| Stage | Run | Figures from |
|---|---|---|
| `blueprint` | one answered message of the human while the reviewer writes or amends the blueprint | the reviewer's own session records, summed once that answer is complete |
| `reviewer` | one answered message of the human in which the reviewer issues a verdict or a prompt | the same |
| `builder` | one Grok run on a task, fix runs included | Cursor's usage for that run, read by the human |
| `review-gate` | an Opus or Sonnet review before merge | that tool's own usage report, read by the human |

A subagent the reviewer starts is its own run, in the stage of the answer that started it.
The human gives the reviewer the figures of every builder and review-gate run; the reviewer
quotes every completed run since the previous fence, as `npm run usage:record` commands, in the
next fence; the builder runs them. A reviewer answer is recorded in a later fence, once it is
complete — never by the answer that issues the fence. A run whose figures cannot be had is
recorded with `--not-reported`.

**Record** — one JSON object per line, keys in this order:

| Key | Value |
|---|---|
| `run_at` | ISO 8601 UTC time the run ended, to the second |
| `tool` | `^[a-z0-9-]+$` — e.g. `claude-app`, `cursor`, `claude-code` |
| `model` | the model id as the tool reports it, `^[A-Za-z0-9._:-]+$` |
| `stage` | `blueprint` · `builder` · `reviewer` · `review-gate` |
| `task` | `blueprint` · `T01`–`T08`, optionally with a fix suffix `-F` or `-F2`… · `go-live` |
| `input` · `output` · `cache_read` · `cache_write` | whole numbers ≥ 0 as reported; all four `null` when not reported |
| `cost_usd` | the tool's own cost figure, or `null` |
| `source` | `tool-report` · `session-records` · `not-reported` |
| `note` | optional, ≤ 120 characters, no names |

`usage:record` takes one flag per key (`--run-at --tool --model --stage --task --input
--output --cache-read --cache-write [--cost-usd] --source [--note]`, or `--not-reported` in
place of the four token flags), validates every value, appends exactly one line, and prints it.
It never rewrites an existing line.

**Report** — `docs/usage/README.md`, regenerated whole. `usage:report -- --check` exits
non-zero when the file differs from what the records produce; CI runs it. The page is:

```
# Usage

Every agent run of this project, totalled from docs/usage/runs.jsonl: one line per run,
appended by npm run usage:record (scripts/usage/record.mjs). Never edit that file by hand.
This page is regenerated by npm run usage:report and is never edited by hand either.

Tokens are as each tool reported them. Cache read and cache write are kept apart from input.
Cost is the tool's own figure where it gives one; otherwise "—". No prices are kept in this
repository; cost is worked out outside it from the token totals.
Reviewer runs are measured from the reviewer's own session records once each answer is
complete.
Not in these totals: any run not recorded in runs.jsonl.

Runs: <n> · Not reported: <n> · Last run: <latest run_at>

## Total
| Runs | Input | Output | Cache read | Cache write | Cost (USD) |

## By model
| Tool | Model | Runs | Input | Output | Cache read | Cache write | Cost (USD) |

## By stage
| Stage | Runs | Input | Output | Cache read | Cache write | Cost (USD) |

## By task
| Task | Runs | Input | Output | Cache read | Cache write | Cost (USD) |
```

Numbers use thousands separators and Western digits. A not-reported run counts in Runs and
adds nothing to the token columns. Cost shows the sum when every run in the row reports one,
and "—" otherwise. Rows: models by tool, then model; stages in the order of the table above;
tasks as `blueprint`, `T01`, its fix runs, `T02` … `T04`, `go-live`.
