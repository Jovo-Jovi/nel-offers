# NELO — Operator Dashboard Spec

Precedence rank 7. The dashboard is for one or two Operators. It lives under `/operator`
(Arabic) and `/en/operator` (English), sends `noindex` and `no-store`, and reads or writes
nothing until the Operator has passed TOTP (`SECURITY_MODEL.md` §3).

## 1. Navigation

Overview · CampaignOffers · Import · Media objects · Campaign settings · language switch ·
sign out. Route segments: `overview`, `campaign-offers`, `import`, `media-objects`,
`campaign-settings`, `sign-in`, `totp`.

One protected layout checks the session (`aal2` and `is_operator()`) for every page except
`sign-in` and `totp`. Every page has a skeleton loading state. The look is the application theme
(OD-02 item 4): cards, clear primary buttons, and motion that confirms an action — a progress bar
per upload, a switch that slides, a toast for each outcome — and none under
`prefers-reduced-motion`.

## 2. Sign-in and TOTP

1. **Sign-in** — email and password. One generic error for any failure ("email or password is
   incorrect"). No sign-up link, no "forgot password" link; a line says recovery is done by
   the project owner.
2. **TOTP enrolment** — when the account has no verified factor: show the QR code and the
   text secret, ask for a six-digit code, verify. On success the session is `aal2`.
3. **TOTP verification** — when a factor exists: ask for the six-digit code. On success the
   session is `aal2`.
4. A session below `aal2` is redirected to step 2 or 3 from every dashboard route.
5. **Sign out** ends the session and returns to sign-in.

## 3. Overview and CampaignOffers

**Overview** shows: the publish switch (§7); counts of `CampaignOffer`s by status — visible,
scheduled, ended, hidden — computed by the visibility function (`DATA_MODEL.md` §3); whether
the contact values are complete; the last `CampaignImport` (time, added, updated, unchanged).

**CampaignOffers** lists every `CampaignOffer` in list order: code, both names, price, start,
end, status, and five slot indicators (main video, main image, gallery 1–3). Fields are read
only. One action per row: **Remove**, behind a confirmation naming the code, which deletes the
`CampaignOffer`, its links, its `MediaObject`s and their objects in R2. The next import may add
the code back.

## 4. Template, export and import

- **Download template** — serves `assets/templates/NELO_offers_template.xlsx` byte-identical.
- **Export current** — `DATA_MODEL.md` §7.
- **Import** — choose one `.xlsx` (≤ 2 MB). The preview shows, in this order:
  1. errors — row, column, the cell as read, and the reason, in the dashboard's locale;
  2. warnings (`DATA_MODEL.md` §4.2);
  3. additions — each new code with its values;
  4. updates — each changed code with every changed field, old and new;
  5. the count of unchanged rows.

  **Confirm** is disabled while any error exists. When the campaign is published, the confirm
  button says that the live site changes at once. If the campaign changed since the preview,
  confirm is refused and the Operator previews again. After confirm, a summary repeats the
  counts.

## 5. Media objects

1. **Select** many files at once (picker or drop). Each becomes a queue row.
2. **Parse** each name, ignoring case:
   - stem equals a code → `.mp4` goes to `main_video`; `.jpg` `.jpeg` `.png` `.webp` go to
     `main_image`;
   - stem is `<code>-1`, `-2` or `-3` with an image extension → `gallery_1` … `gallery_3`;
   - both readings match a code → refused as ambiguous; neither → refused, "no CampaignOffer
     with this code"; `.mp4` with a gallery suffix, or any other extension → refused.
3. **Check** — size (`DECISIONS.md` OD-01 item 10); videos are scanned for location keys and
   refused on a hit (`BOUNDARY_MODEL.md` §3.1); images are re-encoded to WebP, longest edge
   ≤ 1600 px.
4. **Show** each row's target code and slot, and "replaces" when the slot is occupied. Nothing
   uploads until the Operator presses **Upload**.
5. **Upload** with at most three at a time: request a presigned URL, `PUT` with progress, then
   ask the server to finalise (head check, record, link, delete what it replaced). Each row
   ends as done, refused or failed with a reason. A failure leaves no record and no link.

The selected file's name is used for parsing in the browser and sent once to the presign
route for the same parsing on the server. It is never stored or logged.

## 6. Campaign settings

WhatsApp display text · WhatsApp digits · hotline display text · hotline dial string · NEL site
URL. Each is validated as in `DATA_MODEL.md` §2.1, with the error beside the field. Below the
form, the three links the public site will build (WhatsApp, call, NEL site) are shown so the
Operator can try them.

- **Card price switch** — "show the price on the home cards", on by default (OD-02 item 5).
- **Campaign banner** — one image for the home hero (OD-02 item 6): choose, preview, upload with
  the same browser checks and re-encoding as §5, replace, or remove. Removing deletes the object
  in R2.

## 7. Publish switch

- **On** requires every contact value and at least one `CampaignOffer`; a confirmation states
  how many `CampaignOffer`s exist and that each shows only between its own dates. Records
  `published_at` and `published_by`. Once on, the overview's counts — from the visibility
  function — show how many are visible today.
- **Off** is immediate after a confirmation. The public site shows the coming-soon state.

## 8. Copy

Every dashboard string exists in both catalogues, written by the builder and verified by the
reviewer. No dashboard string carries a business value.

## 9. Account runbook (the human)

- **Create an Operator** — Supabase dashboard → Authentication → add the account with
  "auto-confirm"; then run the reviewer-authored `insert into public."Operator"` statement
  (T02) with that account's id. The address and password reach the Operator outside this
  repository and this chat.
- **Remove an Operator** — delete the account in Supabase Auth; the `"Operator"` row goes with
  it.
- **Lost TOTP** — delete the account's factor in Supabase Auth; the Operator enrols again at
  the next sign-in.
- **Lost password** — set a new password for the account in Supabase Auth.
- **Enrol at once.** The first person to sign in with an account's password enrols its TOTP
  factor, so each Operator signs in and enrols right after the account is created.
- **Spec account** — one extra account, used only by end-to-end specs, created the same way; its
  email, password and TOTP secret live only in `.env.local` as `E2E_OPERATOR_EMAIL`,
  `E2E_OPERATOR_PASSWORD` and `E2E_OPERATOR_TOTP_SECRET`. It is removed at go-live.
