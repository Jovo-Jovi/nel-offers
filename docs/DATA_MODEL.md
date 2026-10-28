# NELO — Data Model

Precedence rank 5. Describes the schema, the import, the visibility rule and the offer
content check. The exact SQL is reviewer-authored, rehearsed and landed byte-exact in T02;
where it and this document disagree, the disagreement is a finding, not a choice.

Table names are quoted PascalCase entity names; columns are snake_case. The nine offer
columns carry the template's own header names so the sheet and the table compare field for
field.

## 1. Shape

```
Operator (auth id only)
Campaign (one row) ─ publish switch, contact values
CampaignImport ─< CampaignOffer ─< CampaignOfferMedia >─ MediaObject
   (last_import_id)                (slot)                 (object in R2)
```

## 2. Tables

### 2.1 `"Campaign"` — one row

| Column | Type | Rule |
|---|---|---|
| `id` | smallint | primary key, always `1` |
| `is_published` | boolean | default `false` |
| `published_at` | timestamptz | set when switched on |
| `published_by` | uuid | `"Operator".id`, set null if the Operator is removed |
| `whatsapp_display` | text | as the laboratory wants it shown, ≤ 32 chars |
| `whatsapp_digits` | text | `^[1-9][0-9]{7,14}$` — international, no `+` (for `https://wa.me/<digits>`) |
| `hotline_display` | text | ≤ 32 chars |
| `hotline_dial` | text | `^\+?[0-9]{3,15}$` (for `tel:`) |
| `nel_site_url` | text | `^https://\S+$`, ≤ 200 chars |
| `updated_at` | timestamptz | |

Every contact column is either null or non-blank (check constraints). `is_published` cannot be
true while any contact column is null; the publish action also refuses while no
`CampaignOffer` exists (OD-01 item 12).

Links built from it: WhatsApp `https://wa.me/<whatsapp_digits>`; order
`https://wa.me/<whatsapp_digits>?text=<encoded order message>` where the message is the
catalogue string `campaignOffer.orderMessage` with `{code}` and `{name}` (name in the page's
locale); call `tel:<hotline_dial>`; NEL site `nel_site_url`.

### 2.2 `"CampaignOffer"`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | primary key |
| `code` | text | `^[A-Za-z0-9-]{2,20}$` (template: 2–20 characters, letters, digits and dashes) |
| `code_key` | text | generated `upper(code)`, **unique** — codes compare without case |
| `name_ar` · `name_en` | text | required, 1–200 chars |
| `price_egp` | numeric(12,2) | required, ≥ 0 |
| `starts_on` | date | optional |
| `ends_on` | date | required; `starts_on ≤ ends_on` |
| `conditions_ar` · `conditions_en` | text | optional, ≤ 2000 chars, **both or neither** (OD-01 item 7) |
| `display_order` | integer | optional, ≥ 0 |
| `sheet_row` | integer | row number in the sheet of `last_import_id` |
| `last_import_id` | uuid | `"CampaignImport".id`, the most recent confirmed import that contained this code |
| `created_at` · `updated_at` | timestamptz | |

No dashboard path writes any of the nine offer columns. Only the confirmed import does.

### 2.3 `"CampaignImport"` — insert-only

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | primary key |
| `sheet_sha256` | text | SHA-256 of the uploaded workbook |
| `sheet_rows` | jsonb | the parsed, normalised rows (§4.3), with each row's sheet row number |
| `row_count` · `added_count` · `updated_count` · `unchanged_count` | integer | computed at confirm |
| `confirmed_at` | timestamptz | |
| `confirmed_by` | uuid | `"Operator".id`, set null if the Operator is removed |

### 2.4 `"MediaObject"`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | primary key |
| `object_key` | text | unique, `^media/[0-9a-f-]{36}\.(mp4|webp)$` — chosen by the server |
| `kind` | text | `video` or `image` |
| `content_type` | text | `video/mp4` or `image/webp` |
| `byte_size` | bigint | > 0; ≤ 104857600 (100 MB) for `video`, ≤ 10485760 (10 MB) for `image` |
| `created_at` | timestamptz | |

No column holds the uploaded filename.

### 2.5 `"CampaignOfferMedia"`

| Column | Type | Rule |
|---|---|---|
| `campaign_offer_id` | uuid | cascade on delete |
| `media_object_id` | uuid | unique, cascade on delete |
| `slot` | text | `main_video` · `main_image` · `gallery_1` · `gallery_2` · `gallery_3` |

Primary key `(campaign_offer_id, slot)`. `main_video` holds a `video`; every other slot holds
an `image` (enforced by trigger).

### 2.6 `"Operator"`

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | primary key, `auth.users.id`, cascade on delete |
| `created_at` | timestamptz | |

Inserted by the human in the SQL Editor after creating the account in Supabase Auth.

## 3. Visibility

A `CampaignOffer` is **visible** when all hold:

1. `"Campaign".is_published` is true;
2. `starts_on` is null, or `starts_on ≤ today`;
3. `today ≤ ends_on`;

where `today = (now() at time zone 'Africa/Cairo')::date` (OD-01 item 8). One SQL function
computes it; RLS for `anon`, the public pages and the dashboard's status column all use that
function and nothing else.

Dashboard status for each `CampaignOffer`: **scheduled** (before its window), **visible**,
**ended** (after its window), and — when the campaign is unpublished — **hidden**.

Order on every list: `display_order` ascending with nulls last, then `sheet_row`, then
`code_key` (OD-01 item 9).

## 4. Import

### 4.1 Workbook

- Sheet named exactly `Offers`. Row 1 equals, cell by cell after trimming, `code`, `name_ar`,
  `name_en`, `price_egp`, `starts_on`, `ends_on`, `conditions_ar`, `conditions_en`,
  `display_order`. Otherwise the whole sheet is refused with one error.
- Data rows 2–501. A row whose nine cells are all empty is skipped. Any non-empty cell below
  row 501 or beyond column I is an error. The read-me sheet and any other sheet are ignored.

### 4.2 Cells

| Column | Accepted | Error when |
|---|---|---|
| `code` | text, or a whole number read as its digits | empty; fails the pattern; repeats another row's code ignoring case |
| `name_ar` · `name_en` | text | empty; > 200 chars |
| `price_egp` | number cell; or text of digits with one optional `.` and up to 2 decimals | empty; negative; more than 2 decimals; anything else |
| `starts_on` · `ends_on` | date cell (its calendar date, no time-zone shift); or text `yyyy-mm-dd` | not a date; a time part other than midnight; not after 1 Jan 2026 (the template's own rule); `ends_on` empty; `starts_on` after `ends_on` |
| `conditions_ar` · `conditions_en` | text | one filled and the other empty; > 2000 chars |
| `display_order` | whole number ≥ 0, or empty | anything else |

- Text is trimmed at both ends and otherwise kept exactly. An empty-after-trim cell is empty.
- Arabic-Indic digits (`٠–٩`, `۰–۹`) in a number or date-as-text cell are read as the same
  digits. This is parsing, not correction.
- Every cell is also checked against `BOUNDARY_MODEL.md` §3.2.
- **Warnings** (shown, do not block): `ends_on` already past; rows that would not be visible
  today; the campaign is published, so confirming changes the live site at once.

### 4.3 Normalised row

```
{ "sheet_row": 7, "code": "SYN-001", "name_ar": "…", "name_en": "…",
  "price_egp": "100.00", "starts_on": null, "ends_on": "yyyy-mm-dd",
  "conditions_ar": null, "conditions_en": null, "display_order": 1 }
```

`price_egp` as a string with exactly two decimals; dates as `yyyy-mm-dd`; empty as `null`.

### 4.4 Preview and confirm

- **Preview** compares each normalised row with the stored `CampaignOffer` of the same
  `code_key`: **add** (no such code), **update** (any of the nine fields differs — list each
  changed field, old and new), **unchanged**. It also records the state it compared against
  (row count and latest `updated_at`).
- **Confirm** is disabled while any error exists. On confirm, one SQL function, in one
  transaction: refuses if the stored state no longer matches the preview's ("the campaign
  changed since this preview — preview again"); inserts the `CampaignImport`; upserts every
  row by `code_key`, setting `sheet_row` and `last_import_id` on every row the sheet contains,
  changed or not. Nothing is deleted. Database constraints repeat every rule in §4.2 that a
  column can express, so a defect in the parser cannot store a value the schema forbids.

## 5. The offer content check (non-waivable gate)

`campaign_offer_drift()` returns one row per `CampaignOffer` field that differs from the row
with the same `code_key` in its own `last_import_id`'s `sheet_rows`, and one row per
`CampaignOffer` whose code is missing from that import. **Zero rows is PASS.** Any row is a
HARD FAILURE.

At a gate the human runs, in the Supabase SQL Editor:

```
select count(*) from public.campaign_offer_drift();
select count(*) from public."CampaignOffer";
```

and the report records both numbers as human-attested. Rendered pages are then checked by a
Playwright spec that reads every visible `CampaignOffer` through the public query and asserts
the page shows exactly those values.

## 6. Business values — `guard:literals`

Prices, dates and contact values never appear in source. Certification over `src/**`
(excluding `src/styles/tokens.css`):

1. no `wa.me/` or `tel:` followed by a digit or `+`;
2. no `nileegyptlabs` (both the NEL link and our own address come from data or
   `NEXT_PUBLIC_SITE_URL`);
3. no run of five or more digits in `.ts`, `.tsx`, `.css` — byte limits and durations are
   written as products of smaller numbers (`100 * 1024 * 1024`, `2 * 365 * 24 * 60 * 60`);
4. no ISO date literal (`20\d\d-[01]\d-[0-3]\d`);
5. no run of three or more digits in the i18n catalogues — a limit named in a message (200
   characters, row 501, 100 MB, 1600 px) is a `{placeholder}` filled from the constant;
6. the locale codes `ar` and `en` and the direction words `rtl` and `ltr` appear as string
   literals in `.ts` and `.tsx` only in `src/i18n/config.ts`. The request proxy's matcher
   names no locale; it matches page paths and compares the first segment with the locales from
   `config.ts`. CSS `:dir()` selectors and Tailwind's `rtl:` / `ltr:` variants, used to mirror
   directional icons, are not string literals and are permitted.

The template's own format — the nine headers, rows 2–501, the date floor of 1 Jan 2026 — lives
in one file, `src/lib/sheet-format.ts`, with the date floor written as numbers
(`{ year: 2026, month: 1, day: 1 }`).

Certification as in `GLOSSARY.md` §4, with `--self-check`.

## 7. Export

The export loads the template, writes every `CampaignOffer` from row 2 in list order (§3),
dates as date cells, price as a number, keeps the read-me sheet, and names the download
`NELO_offers_export_<Cairo date>.xlsx` (a value fixed by the template's own name, never a
declared identifier). **Round-trip property:** importing an unmodified
export previews zero additions, zero updates and zero errors.

## 8. Fixtures

Synthetic only, and visibly so: codes `SYN-001` upward; names `تحليل تجريبي 01` /
`Synthetic analysis 01`; round prices; dates relative to the run. No real analysis name,
price or person ever appears in a fixture. Before the real import, every synthetic
`CampaignOffer` is removed through the dashboard's Remove action (which deletes its objects in
R2), then the human runs a reviewer-authored SQL reset for the synthetic `CampaignImport`
rows (`PHASES.md` §4).

## 9. Gate queries and the media scan

- **Orphan count**, run by the human in the SQL Editor, must return 0:
  `select count(*) from public."MediaObject" m where not exists (select 1 from
  public."CampaignOfferMedia" l where l.media_object_id = m.id);`
- **`npm run scan:media-objects`** (built in T03) lists every object in the bucket with the
  server-only R2 values from `.env.local`, reads each one, and prints counts only: objects
  scanned, objects with EXIF, XMP or IPTC, MP4 objects with a location key, and objects with
  no `MediaObject` row. Zero hits on every count but the first is PASS. It prints no key,
  value or object name.
