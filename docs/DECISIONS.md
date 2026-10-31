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

---

## OD-02 — Approved design, review gates, hosting plan and the laboratory's additions

**Status:** SIGNED. The signature is the human's message of 29 Oct 2026 in the reviewer session
("do not make any opus review", "keep hobby plan", "take it exactly and wire with functions", and
the list Andrew asked for). It is recorded by the commit that lands this text on the T03 branch
and ratified when the human merges T03.

**Amends:** OD-01 items 1, 10 and 17; `SCOPE.md` S-01 to S-03 and S-10 to S-13 as listed below;
`DESIGN_SYSTEM.md` §§3, 4, 8 and 10 for the public pages and the dashboard.

1. **Review gates.** No Opus review for any remaining task, Risk 3 included. Compensating
   controls: the reviewer verifies every branch itself; every schema change is reviewer-authored
   SQL, rehearsed, with a rolled-back proof the human runs on the real project. The builder may
   ask Grok for a self-review; it is not a gate.
2. **Hosting.** Vercel Hobby, not Pro; function region `fra1`. Vercel's terms keep Hobby for
   personal, non-commercial use; this is client work, so the risk is tracked as a carry-forward.
3. **Design source.** The designer's implementation in `tony-saleeb/nile` at commit
   `e8f6df734fcfcfa877d30c18dbebc7dcb6ddb21e`, approved by Andrew, is reproduced for the home page
   and the CampaignOffer page: markup structure, components, hover and focus effects, responsive
   grid and the mobile action dock — wired to the data. Its theme (`app/globals.css` `:root`)
   becomes the theme of the whole application; Cairo, self-hosted from `@fontsource/cairo`,
   replaces IBM Plex Sans Arabic; `lucide-react` provides icons. Code is copied once into this
   repository; nothing links to the designer's repository at build or run time. Not copied: the
   footer line "صفحة n ـــ قالب قابل للتعديل", the media caption and terms placeholders, the logo
   placeholder text and the mock data. The header logo is `public/mark/nel-mark.png`.
   `DESIGN_SYSTEM.md` §5 (bilingual, logical properties) and §7 (guards) still bind.
4. **Dashboard.** Our own design in the same theme: plain and guided, with animated upload
   progress, an animated publish switch and short toasts for outcomes; motion stops under
   `prefers-reduced-motion`.
5. **Card price switch.** `Campaign.show_card_price`, on by default. When off, home cards hide
   the price; the CampaignOffer page always shows it.
6. **Campaign banner.** The home hero image is uploaded by an Operator in Campaign settings
   (`Campaign.banner_media_object_id`): the laboratory's banner carries its hotline and address
   in its pixels, so it never lives in source. With no banner, the hero shows its text alone.
7. **Gallery preview.** Tapping the main image or a thumbnail opens a full-screen preview with
   previous and next arrows (mirrored in Arabic), arrow keys, Escape and swipe; a tap outside
   the image closes it and focus returns to what opened it.
8. **Dates.** The page shows the end date in the designer's day / month / year boxes. The start
   date is not shown: a visible page's start is always today or earlier. Amends S-02.
9. **Actions.** On the CampaignOffer page: call (`tel:`) and WhatsApp, and the WhatsApp button
   carries the order message (code and name) — it is "اطلب العرض". In the home hero: hotline and
   a plain WhatsApp chat. The header button opens the NEL site.
10. **Loading.** Skeleton states for the home page, the CampaignOffer page and every dashboard page.
11. **Search** (S-01) stays: one field above the card grid, in the designer's style.
12. **No horizontal overflow** at any width from 320 px, proved at 320, 390, 768, 1024 and 1440.
13. **Copy.** The approved design's header subtitle and hero eyebrow are used — Andrew's approval
    of the design settles the audience line. Their English versions are reviewer drafts
    (`DESIGN_SYSTEM.md` §11).
14. **Any number of CampaignOffers.** Confirmed as built: imports add without limit; one sheet
    holds up to 500 rows (the template's own range).

## OD-03 — Locale prefixes, the coming-soon page, the not-found message and the dashboard address

**Status:** SIGNED. The signature is the human's message of 29 Oct 2026 in the reviewer session,
after testing T04 on the Vercel address ("no /ar in Arabic pages, only /en in English pages", "lab
website header link … in coming soon page is missing", "footer in coming soon page is missing",
"when i enter any url … هذا العرض غير متاح", "i tried /dashboard but nothing"). It is recorded by
the commit that lands this text on the T05 branch and ratified when the human merges T05.

**Amends:** OD-01 item 4; `DESIGN_SYSTEM.md` §§5, 11 and 11.1; `SECURITY_MODEL.md` §§2–3;
`ADMIN_SPEC.md` §1.

1. **Locale prefixes.** Arabic lives under `/ar` and English under `/en`: `/ar`,
   `/ar/campaign-offers/[code]`, `/en`, `/en/campaign-offers/[code]`; the dashboard under
   `/ar/operator/...` and `/en/operator/...`. `/` and every page path without a locale prefix
   redirect temporarily (307) to the same path under `/ar`. Arabic stays the default.
2. **Coming soon.** While the campaign is unpublished, the page shows the full header (with the
   lab-site link when `nel_site_url` is set) and the full footer (hotline and WhatsApp when set, and
   the language switch). Visitors may read the `Campaign` row's granted columns at any time
   (`20261029030000_nelo_campaign_row_public.sql`); `CampaignOffer`s, their media objects and the
   banner stay hidden until the campaign is published.
3. **Not found.** A CampaignOffer code that is unknown or not visible today shows
   `campaignOffer.notFound`; any other unknown path shows `site.pageNotFound`. Both answer 404 with
   the header, the footer and the link home.
4. **Dashboard address.** `/dashboard` redirects (307) to `/ar/operator/overview`, and
   `/ar/dashboard` and `/en/dashboard` to their locale's overview; the overview sends a Visitor
   without a session to sign-in.

## OD-04 — Operator controls, media assignment, dashboard v2, link previews and the SQL runner

**Status:** SIGNED. The signature is the human's message of 29 Oct 2026 in the reviewer session,
after testing T04-F2 on the Vercel address ("admin need to … edit الحالة", "admin needs to select
and remove one video and a simple message appear to confirm", "when i delete video … it is still
there", "differ choice of upload video or image … assign video or image to certain offer if its name
is not the same but mark any assigned already", "revise the dashboard ui/ux … easy clean more
efficient", "when i add video no preview appears", "when i paste link in whatsapp no preview
appears", "no fav icon appears", "when select image in browser it opens in the whole page", "add
readme", "needed sql test make cursor do it"). It is recorded by the commit that lands this text on
the T05 branch and ratified when the human merges T05.

**Amends:** `SCOPE.md` S-10 and S-11; `DATA_MODEL.md` §§2.2, 3 and 9; `BOUNDARY_MODEL.md` §3.1
item 1; `SECURITY_MODEL.md` §§1, 2 and 5; `ADMIN_SPEC.md` §§3, 5 and 10; `DESIGN_SYSTEM.md` §§2.1
and 11.1; PR-29 (superseded by the precedent T05 lands).

1. **SQL runner.** The builder applies reviewer-authored migrations and runs reviewer-authored
   proofs, gate reads and operations with `npm run sql -- <path> [--apply]`
   (`scripts/sql/run.mjs`, reviewer-authored, landed byte-exact). It runs only committed bytes
   listed in a `docs/method/*_BUNDLE.sha256` manifest, over TLS verified against the project's CA
   certificate, and prints outcomes only (`SECURITY_MODEL.md` §2.1). The Session pooler connection
   string (`SUPABASE_DB_URL`, which carries the database password) and the certificate's path
   (`SUPABASE_DB_CA`) live only in the builder machine's `.env.local` — never in Vercel, a commit, a
   report or a chat. **Risk accepted by the human:** that password opens the whole database to
   anyone who can read `.env.local` on that machine. The human may still run any of these files in
   the SQL Editor instead, and does so whenever the runner cannot connect.
2. **Show or hide one CampaignOffer** (the request to edit الحالة). `CampaignOffer.is_shown`, on by
   default, set only by an Operator. Off hides the CampaignOffer and its media objects from
   Visitors whatever its dates; the dashboard status is `off`. It is Operator state like the
   publish switch, not offer content: the import never sets it and the offer content check never
   compares it.
3. **Remove one slot.** An Operator removes the MediaObject in one slot of one CampaignOffer behind
   a confirmation that names the code and the slot; its object in R2 is deleted.
4. **Upload by choice.** The media page has two tabs, Videos and Images. A queued file whose name
   gives a code and a slot is placed there; any file may instead be placed — or re-placed — by the
   Operator's choice of CampaignOffer (searchable by code or name) and slot. A slot that already
   holds a MediaObject is marked as assigned in the choice, and uploading into it asks to confirm the
   replacement. Two queued files may not target the same slot. The browser sends only the code and
   the slot; the name never leaves the browser.
5. **Media library.** The media page lists every stored MediaObject by CampaignOffer and slot, with
   a preview and Remove (item 3). Clearing the upload queue says that it removes nothing stored.
   Objects in R2 with no record are removed with `npm run scan:media-objects -- --remove-unrecorded`.
6. **Dashboard v2.** Easier, cleaner, fewer steps: `ADMIN_SPEC.md` §10.
7. **Public page details.** (a) Link previews: Open Graph and Twitter card tags on every public page
   — title, description, `og:locale` and `og:image` `/share/nelo-share.png` — with `metadataBase`
   from `NEXT_PUBLIC_SITE_URL`. These are tags in the page head, read by WhatsApp and other apps; no
   sharing widget, script or cookie is added (`SCOPE.md` §3 stands). (b) A favicon and app icons. The
   four images are derived from the mark by the reviewer (`DESIGN_SYSTEM.md` §2.1). (c) A main video
   with no main image shows its first frame. (d) The gallery preview keeps a margin around the image
   at every width, so a tap outside it can always close it. (e) On dashboard pages, a file dropped
   outside a drop zone never opens in the tab.
8. **README.** `README.md` describes the site, the dashboard, the stack, the commands and where the
   documents are. It carries no value, account address, key or project reference.
9. **Not adopted: adding or editing a CampaignOffer by hand** ("admin need to add card manually").
   Every name, price, date and condition comes from the laboratory's sheet — the offer content
   gate, which no OD can waive (`SCOPE.md` §3; `DATA_MODEL.md` §5; PR-28). One more card is added by
   Export current → a new row in Excel → Import → Confirm; item 2 switches one off.

## OD-05 — The designer's changes after the go-live test

**Status:** SIGNED. The signature is the human's message of 29 Oct 2026 in the reviewer session,
relaying the designer after the human's test on the live project ("make the header bar hovering
oval shaped", "remove the word (صورة …) from previewed images", "exchange the word (معرض) in
dashboard with صورة", "make toggle of نشر الحملة a normal size", "make the حذف button in red and the
confirm message of deletion to be centered", "a redesign for it in a well modern designed way" for
the CampaignOffer card, "make the items … previewed in المكتبة based on the type selected", "make
any حذف in red"). It is recorded by the commit that lands this text on the T06 branch and ratified
when the human merges T06.

**Amends:** OD-02 item 3 (the approved design, for the header and the thumbnails only);
`DESIGN_SYSTEM.md` §11.1; `ADMIN_SPEC.md` §§5, 7 and 10.

1. **Floating header.** The public header becomes a floating, pill-shaped bar inset from the page
   edges (`DESIGN_SYSTEM.md` §11.1 "Header and footer").
2. **No caption under thumbnails.** The CampaignOffer page's thumbnails show no visible
   "صورة n" caption; the words stay as their accessible name.
3. **Slot names.** In the dashboard the gallery slots are named "صورة 1–3" / "Image 1–3", not
   "معرض" / "Gallery".
4. **Publish switch** at the same normal size as the show switch.
5. **Every removal in red,** and every confirmation dialog centred on the screen.
6. **CampaignOffer card v3** (`ADMIN_SPEC.md` §10).
7. **Library by type.** The media page's library shows the kind of the selected tab only.
8. **Unchanged:** the offer content gate (no hand-made CampaignOffer field), the boundary rules
   (no file name sent or stored), the theme's colours and font.

## OD-06 — No code for Visitors, and "اضغط هنا" on the cards

**Status:** SIGNED. The signature is the human's messages of 30 Oct 2026 in the reviewer session,
after the laboratory's real data was imported, relaying Andrew ("Andrew needs to add (اضغط هنا) on
cards"; "remove the code … as he does not need it"), and the human's answers: "make it hidden from
the card"; "do not show code in offer page and do not add code to whatsapp message"; "keep it for
admin but not in any view for visitors". It is recorded by the commit that lands this text on the
T07 branch and ratified when the human merges T07.

**Amends:** `PRODUCT_BRIEF.md` §2 item 2; SCOPE S-02 and S-03 (by this OD; `SCOPE.md` stays
frozen); OD-02 items 3 and 9 (the approved card and page, the order message); `DESIGN_SYSTEM.md`
§§9, 11 and 11.1; `DATA_MODEL.md` §2.1.

1. **No code in any Visitor view.** The public pages show no CampaignOffer code: not on the home
   cards, not on the CampaignOffer page (the code badge goes), not in the header subtitle, not in
   the link-preview description. The WhatsApp order message carries the name only.
2. **The code stays for the Operator.** It remains the sheet's key column, so an import still
   updates by code, never makes a duplicate and never deletes; the dashboard's identifier; and the
   key that links an uploaded file named by it. The Excel template does not change. The page's
   address still carries the code (`/campaign-offers/<code>`); hiding it there is a route change
   and needs its own OD.
3. **"اضغط هنا" on every card.** Each home card shows `home.cardAction` — "اضغط هنا" / "Click
   here" — with the designer's arrow at its inline end; the whole card stays the one link.

## OD-07 — The whole frame of the main video and image

**Status:** SIGNED. The signature is the human's message of 30 Oct 2026 in the reviewer session,
after the laboratory's first video was uploaded: "i discovered that the uploaded video shows part
not whole frame size". It is recorded by the commit that lands this text on the T08 branch and
ratified when the human merges T08.

**Amends:** OD-02 item 3 (the approved page's 16:10 media frame); `DESIGN_SYSTEM.md` §11.1 "Main
media".

1. **Never cropped.** On the CampaignOffer page the main video and the main image are shown whole:
   the frame takes their own shape, up to 75% of the screen's height. When that limit makes the
   picture narrower than the column, the designer's `primary-soft` fill shows beside it.
2. **Empty frame unchanged.** With neither, the designer's empty 16:10 `primary-soft` frame stays.
3. **Unchanged:** the play button, the poster and first-frame rules, the thumbnails, the dashboard
   tiles and the gallery preview (which already shows the whole image).

## OD-08 — The campaign banner may be a video

**Status:** SIGNED. The signature is the human's message of 31 Oct 2026 in the reviewer session, with
the site live on the laboratory's real data: "site main image لافتة الحملة need to had option to be
videos or image not image only", asking that nothing in the database or the uploads be lost or
reset. It is recorded by the commit that lands this text on the T09 branch and ratified when the
human merges T09.

**Amends:** OD-02 item 6 (one image for the home hero); `DATA_MODEL.md` §2.1; `ADMIN_SPEC.md` §6;
`DESIGN_SYSTEM.md` §§9 and 11.1 "Hero"; `BOUNDARY_MODEL.md` §3.1; PR-33 for T09 only (item 4).

1. **Image or video.** The campaign banner is one image or one MP4 video. An image is re-encoded
   as today; a video has the CampaignOffer videos' size limit (100 MB) and their location check
   (`BOUNDARY_MODEL.md` §3.1). Choosing either replaces the current banner, whichever kind it is.
2. **On the home page.** A video banner plays muted, looped and inline in the designer's image
   cell, whole (`object-contain`), with a small pause and play button. It does not start by itself
   when the Visitor's device asks for reduced motion.
3. **Nothing lost.** `20261031000000_nelo_banner_video.sql` replaces two functions in place
   (`campaign_banner_kind_check`, `attach_campaign_banner`). No table, column, row, policy or grant
   changes; the current banner, the 47 CampaignOffers and every uploaded object stay as they are.
   Its rolled-back proof is `nelo_rls_proof_banner_video.sql`, which supersedes item 5 of
   `nelo_rls_proof_presentation.sql` ("video accepted as banner"); that older proof is not run again.
4. **The writes T09 may make.** T09's fence writes to the project only by running the migration
   once with `--apply` and the rolled-back proof through the runner. No other write, no Playwright
   spec, no `check:r2`, no Operator action; the human tries a video banner in the dashboard after
   the merge.

## OD-09 — The banner video always plays

**Status:** SIGNED. The signature is the human's message of 31 Oct 2026 in the reviewer session, after
T09 went live: "i need video to be auto replay always", and the human's answer "Banner video only"
to the reviewer's question (the banner always starts and loops, with no reduced-motion exception and
no pause button). It is recorded by the commit that lands this text on the T10 branch and ratified
when the human merges T10.

**Amends:** OD-08 item 2; `DESIGN_SYSTEM.md` §§9 and 11.1 "Hero".

1. **Always on.** The home banner video starts by itself, muted, and loops for as long as the page
   is open. It has no pause or play button and no native controls, and it starts whatever the
   Visitor's reduced-motion setting. When the browser pauses it while the page is visible, the page
   starts it again.
2. **Accepted trade-off.** The reviewer stated that a moving video with no way to pause it does not
   meet WCAG 2.2.2 (Pause, Stop, Hide) or the Visitor's reduced-motion preference; the human
   accepted that for the banner. A device that refuses muted autoplay (a phone in power saving, for
   example) shows the video's first frame.
3. **Strings.** `a11y.pauseBanner` and `a11y.playBanner` leave both catalogues.
4. **Unchanged:** CampaignOffer videos (they wait for a tap), an image banner, the dashboard — except
   that the preview of a chosen banner video is named `operator.bannerPreview`, as the image preview
   is.

## OD-10 — A banner the phone holds back shows its first frame and a play button

**Status:** SIGNED. The signature is the human's messages of 31 Oct 2026 in the reviewer session
("it does not work on mobile just blank"; "no i need to play any video in banner") and the
diagnosis that followed: the iPhone's Settings → Accessibility → Motion → "Auto-Play Video
Previews" was off, the W3Schools autoplay example also needed a tap on that phone, and with the
setting on, videos play. It is recorded by the commit that lands this text on the T11 branch and
ratified when the human merges T11.

**Amends:** OD-09 item 1; `DESIGN_SYSTEM.md` §11.1 "Hero".

1. **The cause.** A phone set not to start videos by itself (on an iPhone, "Auto-Play Video
   Previews" off or Low Power Mode; on Android, some power or data savers) refuses autoplay on
   every site. The banner then showed an empty box. No site can override that setting.
2. **Where the phone allows it**, the banner video starts by itself, muted, and loops, with no
   button — as OD-09.
3. **Where the phone holds it back**, the banner shows the video's first frame and the designer's
   round play button over it (`a11y.playVideo`, as on the CampaignOffer page). A tap on the button,
   or any tap on the page, starts it muted and looped, and the button goes.
4. **Unchanged:** CampaignOffer videos, an image banner, the dashboard, the strings.
