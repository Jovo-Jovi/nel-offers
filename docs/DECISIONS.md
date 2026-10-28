# NELO — Decisions

Precedence rank 2, with `SCOPE.md`. Signed operating decisions (ODs). No scope exists outside
`SCOPE.md` and the ODs below. A new OD is appended; a signed OD is never edited — it is
superseded by a later one that names it.

---

## Fit note — Dev OS v2 §17

**What the method keeps, drops and adds for a two-day, four-task build.**

**Kept unchanged.** Reviewer and builder surfaces separated; the chat never writes production
code. Repository over memory. `SESSION_CONTEXT.md` read every session. `PRECEDENTS.md` as the
citable rulebook, superseded explicitly. `CARRY_FORWARDS.md` as the findings ledger, rows
described by the reviewer and numbered by the landing task. Exact verdict and prompt formats.
No evidence is FAIL. Counts computed with the command stated. Self-contained prompts. One task
per branch; the human opens and merges. Vocabulary as a defect class.

**Dropped.** The clinical gate (NELO publishes no clinical text of its own; analysis names
and conditions are the laboratory's sheet). Phase packs (four tasks, four gates). Separate
`CONTENT_MODEL`, `I18N_MODEL`, `HANDOVER` and `CUTOVER_RUNBOOK` documents — folded into
`DATA_MODEL.md`, `DESIGN_SYSTEM.md` §5 and the go-live list in `PHASES.md` §4. A Sonnet review
on every Grok task: review follows the risk table instead.

**Kept from NEL's public period.** The public-repository rules, because this repository is
public until go-live (OD-01 item 2).

**Added.**
1. **The offer content gate** (non-waivable). Every published name, price, date and condition
   traces to an uploaded sheet and an Operator action, proved by a computed comparison inside
   the database (`DATA_MODEL.md` §5), not by inspection.
2. **Boundary controls at the media edge.** Images are re-encoded in the browser before upload,
   which strips all metadata; videos carrying a location atom are refused; filenames are parsed
   and never stored (`BOUNDARY_MODEL.md` §3).
3. **Compression.** The four Risk-3 surfaces — migration and RLS, Operator sign-in with TOTP,
   R2 presigned URLs, security headers — are concentrated in one task (T02) so one Opus review
   covers them. Everything before T02 is reversible; everything after it is Risk 2, except the
   go-live CNAME (OD-01 item 18).
4. **A usage ledger.** Every agent run is recorded as one line and totalled by script
   (`PHASES.md` §5), so the cost of the build is computed, not estimated.

**Where the risk sits.** The engineering is small and well understood. The schedule risk is
outside the repository: the laboratory's real sheet, its media, copy confirmation and DNS
access (`docs/method/CARRY_FORWARDS.md`).

---

## OD-01 — Blueprint approval and scope freeze

**Status:** SIGNED. The signature is the human's approval of this blueprint in the reviewer
session. It is recorded by the commit that lands this file on the T01 branch (that commit's
date is the signing date) and ratified when the human merges T01 to `main`.

**Signs:** `SCOPE.md` as landed with this file, and the decisions below.

1. **Stack.** Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, npm, Node 22 LTS.
   Supabase for data and Operator sign-in (project already created in Central EU, Frankfurt,
   `eu-central-1`).
   Cloudflare R2 bucket `nel-offers-media`, private, S3 API with presigned URLs. Vercel Pro,
   function region `fra1`. `exceljs` for the sheet. `@fontsource/ibm-plex-sans-arabic` for
   type. Playwright for rendered evidence and end-to-end specs, Vitest for unit specs. No UI
   kit.
2. **Repository visibility.** `Jovo-Jovi/nel-offers` is **public from T01 until go-live**, so
   that GitHub Actions runs without the private-repository minute limit, and **private again at
   go-live** (`PHASES.md` §4). While it is public the public-repository rules bind every commit
   (precedent "Public-repository rules"), and every write task first checks that the visibility
   matches this item (precedent "Visibility before push"). Everything pushed while public stays
   public; making the repository private later does not unpublish it.
3. **NEL decoupling.** The only NEL artefacts in this repository are `src/styles/tokens.css`
   and `public/mark/nel-mark.png`, copied once by the reviewer from
   `Jovo-Jovi/nel-nile-egypt-labs` at commit `b95a75b3d3cdb2fb5e4e6867a77ac4bd5c56ed3a`, landed
   byte-exact with their hashes in `DESIGN_SYSTEM.md` §2. Nothing at build or run time
   references the NEL repository, database, bucket, account or key. The NEL site is an
   outbound link whose URL is an Operator-entered contact value.
4. **Routes.** Arabic: `/`, `/campaign-offers/[code]`. English: `/en`,
   `/en/campaign-offers/[code]`. `/ar` and `/ar/...` redirect permanently to the unprefixed
   path. Dashboard: `/operator/...` (Arabic) and `/en/operator/...` (English).
5. **The sheet is the only source of offer fields.** The dashboard cannot edit a
   `CampaignOffer`'s fields. It can remove a `CampaignOffer` (the template's own instructions
   tell the laboratory deletion happens in the dashboard). An import never deletes.
6. **Import is all-or-nothing.** Any error in the sheet blocks confirm. Nothing is applied
   partially.
7. **Conditions come in pairs.** `conditions_ar` and `conditions_en` are both filled or both
   empty — the standing rule that every offer field exists in both languages. A sheet with
   one and not the other is refused with that reason.
8. **Visibility.** A `CampaignOffer` is visible when the campaign is published and today's
   date in `Africa/Cairo` is on or after `starts_on` (or `starts_on` is empty) and on or before
   `ends_on`. The time zone is fixed by the template's own definition of `ends_on` ("Cairo
   time"); it is part of the sheet format, not a setting.
9. **Order.** By `display_order` ascending; empty `display_order` sorts after every numbered
   row, in the sheet-row order of the most recent import that contained it; then by code.
10. **Media.** Video: MP4, at most 100 MB. Image: JPG, PNG or WebP, at most 15 MB as selected;
    re-encoded in the browser to WebP, longest edge at most 1600 px and at most 10 MB, before
    upload. A video
    carrying a location atom is refused. When a `CampaignOffer` has both a main video and a
    main image, the video is shown and the image is its poster. Uploading a name whose slot is
    occupied replaces it, after the queue shows "replaces".
11. **Presigned links.** Upload URLs live 10 minutes; view URLs live 60 minutes. Public pages
    render per request, never cached, because visibility depends on the date and view links
    expire.
12. **Contact values.** WhatsApp display text and WhatsApp digits (international, no `+`),
    hotline display text and dial string, NEL site URL (`https://` only) — entered by an
    Operator in `Campaign`. The publish switch cannot turn on while any is empty or blank, or
    while no `CampaignOffer` exists.
13. **Personal-data refusal at import.** A sheet cell containing an email address, an
    Egyptian mobile number or a 14-digit number is an error (`BOUNDARY_MODEL.md` §3.2). The
    laboratory's contact values belong in `Campaign`, not in conditions.
14. **Operator accounts.** One or two, created by the human in the Supabase dashboard with
    sign-ups disabled. TOTP is mandatory before any dashboard data is readable. No email is
    sent by the system; password and TOTP recovery are performed by the human.
15. **No analytics or error-reporting service.** Nothing third-party loads on a public page.
16. **Copy.** UI copy is taken from the design pack where it exists; the rest, and every
    English string, is a reviewer draft listed in `DESIGN_SYSTEM.md` §9 for Andrew's
    confirmation before go-live. The pack's "Lab to Lab / for labs and doctors" line is not
    used until Andrew confirms the audience.
17. **Review gates.** Grok builds every task. T01, T03 and T04: reviewer verification, with a
    Sonnet review before merge when the human asks. T02 (Risk 3): reviewer-authored SQL,
    reviewer rehearsal, Opus review before merge. Not waived.
18. **Go-live DNS.** The CNAME for `offers` at GoDaddy (Risk 3) is a human action from
    reviewer-authored values, verified by the reviewer from DNS resolution, Vercel's domain
    verification and the served certificate. It changes no code, so the Opus code review is
    waived for that step only, by this OD.
19. **Usage ledger.** Every agent run — reviewer, builder, review gate — is recorded in
    `docs/usage/runs.jsonl` by `npm run usage:record` and totalled in `docs/usage/README.md` by
    `npm run usage:report` (`PHASES.md` §5). No prices are kept in the repository; cost is
    worked out outside it from the token totals.
