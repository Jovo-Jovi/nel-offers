# NELO — Operator Dashboard Spec

Precedence rank 7. The dashboard is for one or two Operators. It lives under `/ar/operator`
(Arabic) and `/en/operator` (English), with `/dashboard` redirecting there (OD-03 items 1 and 4).
It sends `noindex` and `no-store`, and reads or writes nothing until the Operator has passed TOTP (`SECURITY_MODEL.md` §3).

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
scheduled, ended, off, hidden — computed by the status function (`DATA_MODEL.md` §3); whether
the contact values are complete; the last `CampaignImport` (time, added, updated, unchanged).

**CampaignOffers** lists every `CampaignOffer` in list order: code, both names, price, start,
end, status, and five slots (main video, main image, gallery 1–3). The nine sheet fields are read
only; a line under the list says how to change them (export, edit in Excel, import). Actions
(OD-04 items 2–3):

- **Show switch** — on by default. Off hides this `CampaignOffer` from Visitors whatever its dates
  (status `off`); on again restores it. Takes effect at once; a toast confirms.
- **Remove a slot** — on a filled slot, behind a confirmation naming the code and the slot ("Remove
  the main video of SYN-001?"). Deletes the `MediaObject`, its link and its object in R2.
- **Add or replace a slot** — opens the media page with this `CampaignOffer` and slot chosen.
- **Remove** — behind a confirmation naming the code, which deletes the `CampaignOffer`, its
  links, its `MediaObject`s and their objects in R2. The next import may add the code back.

## 4. Template, export and import

- **Download template** — serves `assets/templates/NELO_offers_template.xlsx` byte-identical.
- **Export current** — `DATA_MODEL.md` §7.
- **Import** — choose or drop one `.xlsx` (≤ 2 MB). The page shows at once the chosen sheet's
  name and size (read in the browser only; the name is never sent) and starts the preview without
  a further click; **Preview again** re-reads it and **Choose another** replaces it (the human's
  test of T05, 29 Oct 2026). The preview opens with one summary line — the number of errors, or
  the counts of additions, updates and unchanged rows — and shows, in this order:
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

Two tabs, **Videos** (`.mp4`) and **Images** (`.jpg` `.jpeg` `.png` `.webp`); each tab's picker and
drop zone accept only its kind (OD-04 item 4). Below the tabs, the **library** (OD-04 item 5): every
stored `MediaObject`, grouped by `CampaignOffer` in list order, each with its slot, a preview
(video first frame or image) and **Remove a slot** (§3). A search field filters the library by code
or name.

1. **Select** many files at once (picker or drop). Each becomes a queue row.
2. **Parse** each name, ignoring case:
   - stem equals a code → `.mp4` goes to `main_video`; `.jpg` `.jpeg` `.png` `.webp` go to
     `main_image`;
   - stem is `<code>-1`, `-2` or `-3` with an image extension → `gallery_1` … `gallery_3`;
   - both readings match a code → refused as ambiguous; `.mp4` with a gallery suffix, or any
     other extension → refused;
   - neither reading matches a code → the row waits for the Operator's choice (step 4).
3. **Check** — size (`DECISIONS.md` OD-01 item 10); videos are scanned for location keys and
   refused on a hit (`BOUNDARY_MODEL.md` §3.1); images are re-encoded to WebP, longest edge
   ≤ 1600 px.
4. **Choose** — each row shows its target `CampaignOffer` (a list searchable by code or name) and
   slot (a list of the slots that fit its kind: main video for a video; main image or gallery 1–3
   for an image), filled from the name when the name matched. The Operator may change either. A
   slot that already holds a `MediaObject` is marked "assigned" in the list. Two rows may not target
   the same slot: the second is marked and cannot upload until changed. Nothing uploads until the
   Operator presses **Upload**, and a row targeting an assigned slot asks to confirm the
   replacement first.
5. **Upload** with at most three at a time: request a presigned URL with the code and the slot,
   `PUT` with progress, then ask the server to finalise (head check, record, link, delete what it
   replaced). Each row ends as done, refused or failed with a reason. A failure leaves no record
   and no link. The library refreshes when the queue finishes.
6. **Clear list** empties the queue only, and says so ("Clears this list. Uploaded videos and
   images stay — remove them from the library.").

The selected file's name is read only in the browser, to fill the choice in step 4. The presign
route receives the code and the slot, never the name; the server checks that the code exists and
that the slot fits the type. The name is never sent, stored or logged.

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

## 10. Layout v2 (OD-04 item 6)

Plain, phone-first, one main action per screen. Every rule of §§1–9 still holds.

- **Shell.** Top bar: the mark, the site name, the campaign state as a chip (published / not
  published), the language switch and sign out. Navigation: a side rail from `lg`; below `lg`, a
  bottom bar of five icon-and-label buttons (overview, CampaignOffers, import, media objects,
  settings). The current page is marked. Content is at most 72rem wide.
- **Overview.** First card: the publish switch, the state in words, and — while it cannot be
  switched on — what is missing (contact values, at least one `CampaignOffer`), each a link to the
  page that fixes it. Then the count tiles by status, each a link to the list filtered by it. Then
  "to do": `CampaignOffer`s with neither main video nor main image (count, linked to the filtered
  list), and no import yet. Then the last import.
- **CampaignOffers.** A search field (code or name) and filter chips by status (all, visible,
  scheduled, ended, off, hidden) at the top, with one line under the chips saying in plain words
  what each status means. The status words are plain: visible now, starts later, ended, switched
  off, not published. One card per `CampaignOffer`: code, name in the
  dashboard's locale, price, end date, status chip, the show switch, and the five slots as small
  tiles — a thumbnail when filled, with remove; an empty mark when not, with add. **Remove** the
  `CampaignOffer` sits in the card's "more" menu.
- **Import.** A stepper of four steps: get the template or export the current list; choose the
  sheet; preview (§4 order); confirm and summary.
- **Media objects.** §5: the two tabs, each with its drop zone, queue and **Upload**; the library
  below.
- **Campaign settings.** Three cards: contact values (with the three links to try), the home page
  (price switch and banner), publishing (the switch, as on the overview).
- **Feedback.** A toast for every outcome; a confirmation dialog for every removal, replacement and
  publish change, naming the code and the slot; disabled buttons say why; skeletons on every page;
  no horizontal overflow from 320 px; motion only as in §1, none under `prefers-reduced-motion`.
- **Motion for every action** (§1). A button shows a spinner and is disabled while its action
  runs; a removed card, slot or library row fades and collapses before it leaves; a new library
  row or thumbnail fades in; the switch slides; the toast slides in. Each motion lasts at most
  300 ms.
- **Dropped files.** On every dashboard page, a file dropped outside a drop zone is ignored: the
  browser never navigates to it.
