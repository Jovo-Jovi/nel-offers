# NELO — Scope

Precedence rank 2, with `DECISIONS.md`. **Frozen by OD-01.** Anything not listed in §1 or §2,
or in a later signed OD, does not exist. A change is a new OD, never an edit here.

## 1. Public site (Visitor, no sign-in)

| # | Item | Detail in |
|---|---|---|
| S-01 | Home: visible `CampaignOffer`s in display order, search by Arabic or English name, coming-soon state when unpublished | `DESIGN_SYSTEM.md` §8 |
| S-02 | `CampaignOffer` page: code, both names, price, start and end dates, conditions, main video or image, gallery of up to three images | `DESIGN_SYSTEM.md` §8 |
| S-03 | Actions: WhatsApp, call, "اطلب العرض" (WhatsApp with code and name filled in); link to the NEL site | `DATA_MODEL.md` §2.1 |
| S-04 | Arabic at `/`, English at `/en`; every string and every offer field in both; RTL and LTR | `DESIGN_SYSTEM.md` §5 |
| S-05 | Visibility: published campaign and today inside the `CampaignOffer`'s window (Cairo time); anything else is not found | `DATA_MODEL.md` §3 |
| S-06 | Media shown through short-lived presigned links from the private bucket | `SECURITY_MODEL.md` §5 |

## 2. Operator dashboard (`/operator`, Operator sign-in)

| # | Item | Detail in |
|---|---|---|
| S-07 | Sign-in with email, password and TOTP; TOTP enrolment on first sign-in | `ADMIN_SPEC.md` §2 |
| S-08 | Download the template; export current `CampaignOffer`s in the same format | `ADMIN_SPEC.md` §4 |
| S-09 | Import a sheet: preview with every error and change, confirm, all-or-nothing; updates by code, never deletes | `ADMIN_SPEC.md` §4, `DATA_MODEL.md` §4 |
| S-10 | Overview (publish state, counts by status, last import); `CampaignOffer` list with status and media slots; remove a `CampaignOffer` | `ADMIN_SPEC.md` §3 |
| S-11 | Bulk upload of videos and images by presigned URL; a file named by the code links itself; replace a slot by uploading again | `ADMIN_SPEC.md` §5 |
| S-12 | Campaign settings: contact values | `ADMIN_SPEC.md` §6 |
| S-13 | Publish switch for the whole campaign | `ADMIN_SPEC.md` §7 |
| S-14 | Dashboard in Arabic and English | `DESIGN_SYSTEM.md` §5 |

## 3. Out of scope

Visitor accounts · any form on a public page · bookings, orders or payments taken by the
site · results · analytics, tracking, error-reporting services · editing a `CampaignOffer`'s
fields in the dashboard (the sheet is the only source) · more than one campaign · page-copy
editing in the dashboard · email sending of any kind (password reset, notifications) ·
Operator self-service account creation or recovery · changes to the NEL site · a Visitor
newsletter · social sharing widgets · server-side video transcoding.

## 4. Fixed inputs

- Excel format: `assets/templates/NELO_offers_template.xlsx`, sheet `Offers`, header row
  `code · name_ar · name_en · price_egp · starts_on · ends_on · conditions_ar · conditions_en ·
  display_order`. Required: `code`, `name_ar`, `name_en`, `price_egp`, `ends_on`.
- Media naming: `<code>.mp4` main video · `<code>.<jpg|jpeg|png|webp>` main image ·
  `<code>-1` … `<code>-3` with an image extension for the gallery.
- Address: `offers.nileegyptlabs.com`, one CNAME at GoDaddy at go-live.
- Deadline: live by 30 Oct 2026.
