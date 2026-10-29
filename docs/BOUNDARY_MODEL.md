# NELO — Boundary Model

Precedence rank 3. Defines the **boundary gate (no personal data)**: proof that no table,
column, bucket, form, route handler or log accepts or retains personal data. Non-waivable.
It applies at every gate that touches schema, routes or storage.

## 1. The line

NELO holds the laboratory's campaign and nothing about people.

- **Visitors** are never identified, counted, tracked or stored. No public page sets a cookie,
  reads one, loads a third-party script, or sends anything to our servers except page
  requests.
- **Operators** are the one deliberate exception, and only inside Supabase Auth: email,
  password hash and TOTP factor live in the `auth` schema, created by the human. The `public`
  schema holds an Operator's `auth` id (a UUID) and nothing else — no name, no email.
- **Contact values** (WhatsApp, hotline, NEL link) are the laboratory's published business
  numbers, not personal data. They live only in `Campaign`.

## 2. Every way data enters

| Entry | Who | What may enter | Control |
|---|---|---|---|
| Public page request | Visitor | A URL path | GET only. No query parameter is read. No form, no server action, no POST handler under the public tree. |
| Search box | Visitor | Characters typed | Filtered in the browser. Never sent to a server, never put in the URL, never stored. |
| WhatsApp / call actions | Visitor | — | Open `wa.me` / `tel:`. The conversation happens in WhatsApp or on the phone, never through NELO. |
| Sign-in | Operator | Email, password, TOTP code | Supabase Auth only. Nothing copied to `public`. |
| Sheet import | Operator | Offer fields | §3.2 refusals; only the nine template columns are read. |
| Media upload | Operator | Images and videos | §3.1 controls; filename read in the browser only, never sent or stored. |
| Campaign settings | Operator | Contact values | Format checks (`DATA_MODEL.md` §2.1). |
| Usage records | Reviewer, human | Tool, model, stage, task, token counts | Fixed keys and formats; the note holds no names (`PHASES.md` §5). |

## 3. Controls

### 3.1 Media

1. **Target by name or by choice** (OD-04 item 4). A name `<code>.<ext>` or
   `<code>-<1|2|3>.<ext>` fills the target in the browser; the Operator may choose any
   `CampaignOffer` and any slot that fits the kind instead. The browser sends only the code and
   the slot; the presign route checks that the code resolves to an existing `CampaignOffer` and
   that the slot fits the type. The name is read only in the browser and is **never sent or
   stored**; the object key is `media/<uuid>.<ext>`, chosen by the server.
2. **Images are re-encoded** in the browser (decode → canvas → WebP) before upload. Re-encoding
   drops EXIF, XMP and IPTC, including GPS and device owner.
3. **Videos with a location atom are refused.** The browser scans the MP4 for `©xyz` and
   `udta`/`meta` location keys before requesting an upload URL; a hit refuses the file with a
   message to export it without location. Device model and creation time may remain; neither
   identifies a person.
4. **Server check after upload.** The server reads the object's size and type from R2 before
   recording a `MediaObject`; a mismatch with the signed values deletes the object.
5. **Residual.** These controls stop accidental retention by a trusted, TOTP-verified
   Operator. They are not a defence against a malicious Operator; that risk is accepted
   because Operators are one or two named laboratory staff.

### 3.2 Sheet

The import refuses (as an error that blocks confirm) any cell in any of the nine columns
containing:

- an email address (`[^\s@]+@[^\s@]+\.[^\s@]+`);
- an Egyptian mobile number, ignoring spaces and dashes: `01[0125]` followed by 8 digits, or
  `+20` or `0020` followed by `1[0125]` and 8 digits;
- a run of 14 digits (the length of an Egyptian national ID).

The error names the row and column and says: contact numbers belong in the dashboard's
campaign settings, not in the sheet. Offer content is not corrected — it is refused, and the
laboratory fixes its sheet.

### 3.3 Logs and platforms

- The application writes no log line containing a request body, header, IP address, sheet
  cell or filename. Server errors log a short code and the route only.
- No log drain, analytics, session replay or error-reporting service is configured.
- **Platform residual.** Vercel and Supabase keep their own request and auth logs (which
  include IP addresses) under their own retention. NELO adds nothing to them and reads
  nothing from them. Recorded here so the gate states it rather than ignores it.

### 3.4 Excluded outright

Contact forms · booking · newsletter · Visitor accounts · cookies on public pages · analytics
· chat widgets · embedded third-party scripts or fonts · maps · social pixels.

## 4. `guard:boundary` — what it certifies

1. Under the public route tree (every path in `src/app/**` with no `operator` segment;
   Operator route handlers live under `src/app/api/operator/**`): no `<form`,
   no `"use server"`, no route handler exporting `POST`, `PUT`, `PATCH` or `DELETE`, no
   `cookies()` call, no `searchParams` read.
2. `package.json` contains none of a denylist of analytics, tracking and error-reporting
   packages (at least: `@vercel/analytics`, `@vercel/speed-insights`, `posthog-js`,
   `posthog-node`, `@sentry/nextjs`, `@sentry/node`, `mixpanel-browser`, `@segment/analytics-next`,
   `react-ga4`, `@hotjar/browser`).
3. No `console.log` / `console.info` / `console.debug` in `src/**`; `console.error` and
   `console.warn` only with a literal first argument.
4. From T02: no column in `supabase/migrations/**` with a word (split at `_`) in `email`,
   `phone`, `mobile`, `name` (except the columns `name_ar` and `name_en`), `address`,
   `birth`, `national`, `ip`, `filename` or `original`.

Certification as in `GLOSSARY.md` §4: exit 0 on the repository, plus a `--self-check` that
proves each rule against must-fail and must-pass samples as strings and as files outside the
repository.

## 5. Evidence at each gate

| Gate | Evidence |
|---|---|
| G1 (T01) | `guard:boundary` output; Playwright report that public pages set zero cookies and make no request to any origin but the site's own. |
| G2 (T02) | Column inventory from `information_schema.columns` for schema `public`, run by the human in the SQL Editor and pasted as human-attested; every column classified. Storage: bucket private, no `r2.dev` access, no custom domain — human-attested from the R2 dashboard. |
| G3 (T03) | Specs proving §3.2 refusals; `npm run scan:media-objects` and the orphan count (`DATA_MODEL.md` §9) both at zero. |
| G4 (T04) | Full re-run of G1–G3 against production, after the real sheet and media are in. |
