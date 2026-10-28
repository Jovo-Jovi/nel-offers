# NELO — Product Brief

Nile Egypt Labs Opening Offers. Precedence rank 1, with `GLOSSARY.md`.

## 1. What it is

Nile Egypt Labs opens soon and runs a time-limited opening campaign: a set of analyses
offered at a campaign price. NELO is a small bilingual web app, separate from the NEL site,
that publishes that campaign at `offers.nileegyptlabs.com`.

## 2. Who uses it

| Person | What they do | Sign-in |
|---|---|---|
| **Visitor** | Anyone. Browses the campaign, opens one analysis on offer, contacts the laboratory by WhatsApp or phone. | None. There are no Visitor accounts. |
| **Operator** | One or two laboratory staff. Maintain the campaign from the dashboard. | Email, password and a TOTP code. |

## 3. What a Visitor sees

1. **Home** — the campaign's `CampaignOffer`s that are visible today, in display order, with
   search by analysis name (Arabic or English).
2. **One page per `CampaignOffer`** — its code, Arabic and English names, price, its own
   start and end dates, conditions, a main video or image, a gallery of up to three images,
   and three actions: WhatsApp, call, and **اطلب العرض** (order), which opens WhatsApp with
   the code and name filled in. A link leads to the NEL site.
3. Arabic by default, English second. Every string and every offer field exists in both.

When the campaign is not published, the site shows a coming-soon state and no
`CampaignOffer` at all.

## 4. What an Operator does

1. Downloads the Excel template, or exports the current `CampaignOffer`s in the same format.
2. Fills it in and imports it. A preview lists every error and every change before anything
   is saved; confirming applies it. An import adds new codes and updates existing ones. It
   never deletes.
3. Uploads many videos and images at once. A file named by the code links itself
   (`OFF-001.mp4`, `OFF-001.jpg`, `OFF-001-1.jpg` … `OFF-001-3.jpg`).
4. Removes a `CampaignOffer` from the dashboard when it should go (the template's own
   instructions promise this).
5. Enters the laboratory's contact values (WhatsApp, hotline, NEL site link) once.
6. Publishes or unpublishes the whole campaign with one switch.

## 5. Standing rules

- **Arabic default, English second.** Every user-facing string and every offer field in both.
- **Public, no Visitor accounts.** No sign-in, no cookie, no tracking on public pages.
- **No personal data collected anywhere.** No form on any public page.
- **WhatsApp and phone are the only contact channels.** "اطلب العرض" opens WhatsApp, never a form.
- **Offer content is the laboratory's.** Names, prices, dates and conditions come only from
  the uploaded sheet. We never correct them; we refuse a sheet that breaks a rule and say why.
- **The NEL site is linked, never touched.** No shared repository, database, bucket, account
  or key.
- **Business values live in the database.** WhatsApp number, hotline and NEL link are entered
  by an Operator, never written into source.

## 6. Success

Live at `offers.nileegyptlabs.com` within two days (by 30 Oct 2026), with the laboratory's
real sheet imported, its media linked, the published values equal to the sheet by a computed
check, and the boundary gate passed with evidence.

## 7. Not this product

Results, bookings, payments, Visitor accounts, a contact form, analytics, a CMS for page copy,
the NEL site itself. See `SCOPE.md` §3.
