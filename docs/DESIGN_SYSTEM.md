# NELO — Design System

Precedence rank 6. Inherits NEL's tokens and mark, unchanged. The designer's files and the
laboratory's pack in `docs/research/` are evidence for layout and copy, never authority: where
one conflicts with this document, this document wins and the conflict is raised as an
amendment.

## 1. Principles

1. One visual family with the NEL site, reached by copying its tokens and mark once — never by
   linking to NEL's repository, CSS or CDN.
2. Arabic first. Every layout is designed in RTL and mirrored by logical properties, never by a
   second stylesheet.
3. A rule that protects a measurable floor is written as its certification condition, not as a
   blanket ban.

## 2. Inherited artefacts

Copied by the reviewer from `Jovo-Jovi/nel-nile-egypt-labs` at commit
`b95a75b3d3cdb2fb5e4e6867a77ac4bd5c56ed3a`, landed byte-exact in T01. SHA-256 of the committed
bytes:

| Path in this repository | SHA-256 | Note |
|---|---|---|
| `src/styles/tokens.css` | `784a9d2c062d4736fa33b14e2bd1a0614c2bebc7523cd08d0a573205b325e06b` | Comments cite NEL's own records (§, D-, OD-, P-numbers); they are provenance, not NELO decisions. |
| `public/mark/nel-mark.png` | `95bcdf2da6a6533ba6593b1413f6bebc6c7b055a8a0c4b6f234157ac1134ea3e` | 537 × 752 px PNG. |

Neither file is edited in this repository. A change to either is a new OD.

### 2.1 Images derived from the mark (OD-04 item 7)

Made by the reviewer from `public/mark/nel-mark.png` alone (scaled onto white; the share image adds
a 36 px band in `--nel-color-primary` at its foot), landed byte-exact in T05. No other source, no
text added. They are NEL artefacts like the two above: never edited here, and a change is a new OD.

| Path in this repository | SHA-256 | Use |
|---|---|---|
| `public/share/nelo-share.png` | `cf1a274817f24ce81d46982091004b5ff700ca5e57038b4e1a0b022519383ae2` | 1200 × 630 px; `og:image` and `twitter:image` |
| `public/share/icon-512.png` | `9a271c753fd5bf5c854f3277718b9288f6876d9d24a97bca8edbc3cf5ef2f977` | 512 × 512 px; `icon` |
| `public/share/apple-icon-180.png` | `2c202ff8251aed723f5cf88eb42e4164205c0ddaf27f3948dd63201babe8c931` | 180 × 180 px; `apple-touch-icon` |
| `public/favicon.ico` | `180c4bed3dff2d1d41dd775f174f57246454c90178f13ee2b847abe0f4ef58f8` | 16, 32 and 48 px; the favicon |

## 3. Colour

The eleven `--nel-color-*` tokens in `tokens.css` and its `color-mix` recipes are the whole
palette. A new recipe is permitted when it is a `color-mix` of existing tokens and its contrast
is computed and recorded here: ≥ 4.5:1 for text, ≥ 3:1 for UI boundaries and icons. No hex,
`rgb()` or named colour appears anywhere else in source.

## 4. Type

- **IBM Plex Sans Arabic**, weights 400, 500 and 600, from the npm package
  `@fontsource/ibm-plex-sans-arabic` (Arabic and Latin subsets), served from our own origin.
  The one `font-family` declaration lives in `src/styles/fonts.css`; the three weight
  stylesheets are imported once, from that file or from the locale root layout.
- Sizes from `--nel-size-*`; spacing from `--nel-space-*`; radius from `--nel-radius-*`.
- Line height follows the locale fork in `tokens.css`, keyed on `data-locale` on `<html>`.

## 5. Bilingual and RTL

- Locales live in `src/i18n/config.ts` only: `ar` (default, RTL, under `/ar`) and `en` (LTR,
  under `/en`); a page path without a locale prefix redirects to `/ar` (OD-03 item 1). `<html lang dir data-locale>` is set once, from the active locale.
  Never on individual elements.
- Catalogues `src/i18n/ar.ts` and `src/i18n/en.ts`. The English catalogue is typed as the
  Arabic one's shape, so a missing key fails `typecheck`. No fallback from one locale to the
  other at run time.
- **Logical properties only**: `margin-inline-*`, `padding-inline-*`, `inset-inline-*`,
  `text-align: start | end`, `border-inline-*`; Tailwind `ms- me- ps- pe- start- end-
  text-start text-end border-s border-e rounded-s rounded-e`.
- **Latin runs inside Arabic text are isolated** through one component,
  `src/components/latin-run.tsx`, which renders `<bdi>` with its direction taken from
  `src/i18n/config.ts`: the code, the English name, phone numbers, URLs and prices. Digits-only
  runs need the explicit direction — with no strong character, `<bdi>` alone would take the
  surrounding RTL direction and reorder groups.
- **Digits are Western in both locales.** Numbers and dates are formatted with `Intl`, using
  the active locale with the `-u-nu-latn` extension. Dates are plain calendar dates, formatted
  with `timeZone: 'UTC'` so no shift occurs.
- **Intl output inside `LatinRun` carries no bidi marks.** Arabic `Intl` formats insert U+200F
  (and may insert U+200E or U+061C) between parts; inside a left-to-right isolate they reorder the
  groups, so `18/11/2026` renders as `182026/11/`. Every formatter whose result is placed in
  `LatinRun` removes those three characters first.
- Directional icons (arrows, chevrons) mirror. The mark, numerals and media controls do not.
- The language switch keeps the Visitor on the same `CampaignOffer` when there is one.

## 6. Tailwind

Tailwind CSS 4. `globals.css` imports `tokens.css` and `fonts.css`, then maps tokens into
Tailwind's theme with `@theme inline` (colours, sizes, spacing, radius). Utility classes use
only those mapped names. No arbitrary colour values (`bg-[#…]`), no default palette colours.

## 7. `guard:design` — what it certifies

Over `src/**/*.{ts,tsx,css}` (excluding `src/styles/tokens.css`; rule 2 also excludes
`src/styles/theme.css`, which holds the approved design's own values, §11):

1. No physical property: CSS `margin-left|right`, `padding-left|right`, `left:`, `right:`,
   `border-left|right`, `text-align: left|right`, `float: left|right`; Tailwind `ml- mr- pl-
   pr- left- right- text-left text-right border-l border-r rounded-l rounded-r` and their
   responsive or state variants. In a JSX `style` object the camelCase forms count the same
   (`marginLeft`, `paddingRight`, `left`, `right`, `borderLeft`, `textAlign: "left"`,
   `float: "right"` and the like).
2. No colour literal: `#rgb`, `#rrggbb`, `rgb(`, `rgba(`, `hsl(`, or a default Tailwind
   palette class (`bg-red-500` and the like).
3. No `font-family` outside `src/styles/fonts.css`.
4. No `dir` JSX attribute except on `<html>` and in `src/components/latin-run.tsx`. A variable
   or property that happens to be named `dir` is not an attribute.

Certification as in `GLOSSARY.md` §4, with `--self-check`.

## 8. Composition

From the design pack (`docs/research/`, slide 1 home, slides 2–26 one page per code),
reconciled with `PRODUCT_BRIEF.md`:

**Home.** Header: mark at inline-start, site name, campaign title. Heading, intro line, search
box. A list of cards in display order; each card shows its two-digit position in the visible
list, the analysis name in the page's locale, and "view details" with a mirroring arrow.
Footer: WhatsApp and hotline as text from `Campaign`, the NEL site link, the language switch.
States: published with matches · published with no match for the search · published with
nothing visible today · unpublished (coming soon, no `CampaignOffer` at all).

**Search** runs in the browser over the visible list. A card matches when the normalised query
is a substring of its normalised `name_ar` or `name_en`. Normalising: trim and collapse spaces;
lower-case Latin; drop Arabic diacritics (U+064B–U+0652) and tatweel (U+0640); read `أ إ آ ٱ`
as `ا`, `ى` as `ي`, `ة` as `ه`. An empty query shows every visible card.

**CampaignOffer page.** Heading "offer details — code"; code; the name in the page's locale
first and the other locale's name second; main video (poster: the main image, if any) or main
image; price with currency; the date line (start and end when there is a start, end only
otherwise); conditions in the page's locale, when present; gallery of up to three images;
actions WhatsApp, call, order; footer as home. A code that is not visible today renders the
not-found state, in the page's locale.

**Evidence widths.** Phone 390 × 844 and desktop 1440 × 900, both locales, every task that
renders a page.

## 9. Copy

`Source`: **pack** = the design pack, slide named; **template** = the template's read-me sheet;
**draft** = written by the reviewer, awaiting Andrew's confirmation (carry-forward).

| Key | Arabic | English | Source |
|---|---|---|---|
| `site.name` | معامل النيل مصر | Nile Egypt Labs | pack s1 · template |
| `site.campaignTitle` | عروض الافتتاح | Opening offers | template |
| `home.heading` | عروض التحاليل الطبية | Analysis offers | pack s1 · en draft |
| `home.intro` | اختَر التحليل لعرض التفاصيل والسعر ومدة العرض ووسائل الطلب. | Choose an analysis to see its details, price, offer period and how to order. | pack s1 · en draft |
| `home.searchPlaceholder` | ابحث باسم التحليل... | Search by analysis name… | pack s1 · en draft |
| `home.noMatches` | لا توجد تحاليل مطابقة للبحث. | No analysis matches your search. | draft |
| `home.nothingVisible` | لا توجد عروض متاحة اليوم. | No offers are available today. | draft |
| `home.comingSoon` | العروض ستُتاح قريبًا. | Offers will be available soon. | draft |
| `home.viewDetails` | عرض التفاصيل | View details | pack s1 · en draft |
| `campaignOffer.pageHeading` | تفاصيل العرض — كود {code} | Offer details — code {code} | pack s2 · en draft |
| `campaignOffer.codeLabel` | كود العرض | Offer code | pack s2 · en draft |
| `campaignOffer.priceLabel` | سعر العرض | Offer price | pack s2 · en draft |
| `campaignOffer.currency` | جنيه مصري | EGP | pack s2 · en draft |
| `campaignOffer.endsOn` | ينتهي العرض في {end} | Offer ends on {end} | pack s2 · en draft |
| `campaignOffer.validFromTo` | العرض من {start} إلى {end} | Offer runs from {start} to {end} | draft |
| `campaignOffer.conditionsHeading` | شروط العرض | Offer conditions | pack s2 · en draft |
| `campaignOffer.galleryAlt` | صورة {position} — {name} | Image {position} — {name} | draft |
| `campaignOffer.orderMessage` | أرغب في طلب العرض {code} — {name} | I would like to order offer {code} — {name} | draft |
| `campaignOffer.notFound` | هذا العرض غير متاح. | This offer is not available. | draft |
| `actions.whatsapp` | واتساب | WhatsApp | pack s2 |
| `actions.call` | اتصل {hotline} | Call {hotline} | pack s2 · en draft |
| `actions.order` | اطلب العرض | Order this offer | pack s2 · en draft |
| `footer.whatsapp` | واتساب {number} | WhatsApp {number} | pack s1 |
| `footer.hotline` | الخط الساخن {number} | Hotline {number} | pack s1 · en draft |
| `footer.nelSite` | موقع معامل النيل مصر | Nile Egypt Labs website | draft |
| `nav.allCampaignOffers` | كل العروض | All offers | draft |
| `nav.switchLocale` | English | العربية | draft |
| `a11y.mark` | شعار معامل النيل مصر | Nile Egypt Labs logo | draft |

Not used until Andrew confirms the audience: the pack's "دليل العروض الإلكترونية — Lab to
Lab" and "عروض مخصصة للمعامل والأطباء". Dashboard copy is written by the builder in both
catalogues in T02–T03 and verified by the reviewer.

## 10. The designer's UI

Applied in T04 over working pages. The designer's files must be in `docs/research/` with
their hashes before T04 is issued. They may change layout, spacing, imagery treatment and
component shape inside §§3–7; they may not add a colour, a font, a physical property, a
literal business value, or copy outside §9 without an amendment.

## 11. The approved design (OD-02)

The home page and the CampaignOffer page reproduce the designer's implementation in
`tony-saleeb/nile` at commit `e8f6df734fcfcfa877d30c18dbebc7dcb6ddb21e`. Reference screenshots
are in `docs/research/design/`. Where this section and §§3, 4, 6, 8 or 10 differ, this section
wins; §7 is amended to match.

**Theme.** `src/styles/theme.css` holds the designer's `:root` values (`app/globals.css`) as one
Tailwind 4 `@theme` block under the designer's names: `--color-primary`, `--color-primary-soft`,
`--color-dark`, `--color-accent`, `--color-whatsapp`, `--color-bg`, `--color-surface`,
`--color-muted`, `--color-border`; `--radius-card`, `--radius-button`; `--shadow-card`; `--text-xs`
… `--text-5xl`, each with the designer's line height as `--text-<size>--line-height`. A value equal
to a NEL token is written as that token: primary, accent, dark (`--nel-color-text`), bg
(`--nel-color-background`), surface and muted. The others keep the designer's literal value.
`globals.css` imports `theme.css` in place of T01's `@theme inline` block and keeps, from NEL, only
`--color-primary-strong`, `--color-success`, `--color-warning` and `--color-error` (dashboard
states). It sets no `--spacing-*` and no other `--radius-*`, so Tailwind's default scales give the
designer's utilities (`p-3`, `w-4`, `max-w-7xl` …) the sizes they had in the designer's Tailwind 3
build. Type is Cairo (`@fontsource/cairo`, weights 400, 500 and 700 — the weights the design uses),
declared once in `src/styles/fonts.css`. Icons are `lucide-react`; an icon whose export name holds a
forbidden noun is imported under another name (`FileSpreadsheet as SheetIcon`).

**Components** (designer name → ours): `PageShell`, `Header`, `Footer`, `OfferCard` →
`CampaignOfferCard`, `OfferGrid` → `CampaignOfferGrid`, `CodeBadge`, `MediaSlot` → `MainMediaObject`,
`ThumbnailRow`, `PriceCard`, `ExpiryBox`, `TermsBox`, `ActionButtons`, `WhatsAppIcon`; new:
`SearchField`, `GalleryPreview`, `Skeleton`. Same markup, same classes' visual result, same hover
and focus behaviour; physical utilities become logical ones and `dir` spans become `LatinRun`.

**Data.** Card: position number, code, name in the page's locale, price only when
`show_card_price`. Page: name in the page's locale first and the other second, code badge, main
media, thumbnails, price, end date in day / month / year boxes, conditions in the page's locale
(the box is omitted when there are none), call and WhatsApp-order buttons. Header: mark, site
name, page subtitle, NEL site button. Footer: hotline and WhatsApp from `Campaign`, language
switch.

**Gallery preview.** A dialog over a dimmed page: the image fitted to the viewport, previous and
next buttons at the inline edges (mirrored in Arabic), a close button, a position line
("2 / 4"). Arrow keys move, Escape closes, a swipe moves on touch, a tap outside the image closes.
Focus is trapped while open and returns to the opener.

**Skeletons.** Each page's `loading.tsx` draws the page's blocks in `primary-soft` with a slow
shimmer; no shimmer under `prefers-reduced-motion`.

**Inline styles.** The Content Security Policy has no `style-src` exception, so nothing renders a
`style` attribute: use classes, `<progress>`, or a CSS custom property set from an effect.

**Copy added** (`designer` = the approved design; English is a reviewer draft):

| Key | Arabic | English | Source |
|---|---|---|---|
| `header.homeSubtitle` | Lab to Lab ـــ دليل العروض الإلكترونية | Lab to Lab — Online offers guide | designer |
| `header.campaignOfferSubtitle` | كود {code} ـــ تفاصيل العرض | Code {code} — Offer details | designer |
| `header.labSite` | موقع المعمل | Lab website | designer |
| `home.eyebrow` | عروض مخصصة للمعامل والأطباء | Offers for laboratories and doctors | designer |
| `campaignOffer.endsOnLabel` | ينتهي العرض في: | Offer ends on: | designer |
| `campaignOffer.day` | اليوم | Day | designer |
| `campaignOffer.month` | الشهر | Month | designer |
| `campaignOffer.year` | السنة | Year | designer |
| `campaignOffer.imageLabel` | صورة {position} | Image {position} | designer |
| `actions.callShort` | اتصل | Call | designer |
| `a11y.playVideo` | تشغيل الفيديو | Play video | draft |
| `a11y.previousImage` | الصورة السابقة | Previous image | draft |
| `a11y.nextImage` | الصورة التالية | Next image | draft |
| `a11y.closePreview` | إغلاق | Close | draft |
| `a11y.banner` | صورة حملة معامل النيل مصر | Nile Egypt Labs campaign banner | draft |
| `site.pageNotFound` | الصفحة غير موجودة. | Page not found. | draft (OD-03 item 3) |
| `site.errorMessage` | تعذّر عرض هذه الصفحة الآن. | This page could not be shown right now. | draft (CF-38) |
| `site.tryAgain` | حاول مرة أخرى | Try again | draft (CF-38) |

### 11.1 Wiring decisions (T04)

Where the approved design shows a placeholder, it is wired as follows. The designer's source at
`e8f6df73` is kept for reference in `docs/research/design/source/` (each file renamed with a `.txt`
suffix so that nothing compiles it).

- **Mark.** `public/mark/nel-mark.png` fills the header's 48 px logo slot (`object-contain` on
  `bg-surface`, the slot's own rounded shape), linking home. Alt text `a11y.mark`.
- **Hero.** The Operator's banner (`Campaign.banner_media_object_id`) in the designer's image cell,
  alt `a11y.banner`; with no banner the cell is omitted and the text cell spans the row. Text cell:
  `home.eyebrow`, `home.heading` with `site.name` as the designer's second line, `home.intro`,
  then the hotline button (`footer.hotline`, `tel:` from `hotline_dial`) and the WhatsApp button
  (`actions.whatsapp`, a plain `https://wa.me/<whatsapp_digits>` chat).
- **Search.** One field (`home.searchPlaceholder`, also its accessible name) at the top of the
  card-grid panel, in the panel's own style (`rounded-button border border-border bg-bg`, the
  designer's focus ring, a `Search` icon at inline-start). Filtering hides cards; each card keeps its
  number. With no match, `home.noMatches` replaces the grid.
- **Card.** The designer's card: the number (two digits, position in the visible list), the code
  (`LatinRun`), the name in the page's locale, the price with `campaignOffer.currency` only when
  `show_card_price`, and the designer's arrow, mirrored for English. The whole card is the link.
- **CampaignOffer page.** Back link `nav.allCampaignOffers` with the designer's arrow (mirrored).
  `h1` the name in the page's locale; under it the other locale's name with its own `lang` (English
  in `LatinRun`, Arabic in a `<bdi>` with no `dir`). `CodeBadge` with `campaignOffer.codeLabel`.
- **Main media.** A main video is a `<video>` with `controls`, `preload="metadata"`, `playsinline`
  and the main image as poster; the designer's play button sits over it until it plays
  (`a11y.playVideo`). With no main image, the video's source URL ends with `#t=0.1` so the browser
  draws its first frame instead of a blank frame (OD-04 item 7c). Otherwise the main image, which
  opens the gallery preview. With neither, the designer's `primary-soft` frame stays empty. The
  designer's caption is not used.
- **Thumbnails.** The gallery images (`gallery_1`–`gallery_3`) in slot order. `campaignOffer.imageLabel`
  is their accessible name only; no caption is drawn under them (OD-05 item 2). With none, the row is omitted and the main media takes the full width.
  The preview set is the main image (when present) followed by the gallery images.
- **Price, date, conditions.** `PriceCard` always shows the price. `ExpiryBox` puts the end date's
  day, month and year (Western digits, each in `LatinRun`) above the designer's labels. `TermsBox`
  shows the conditions in the page's locale and is omitted when there are none.
- **Actions.** `ActionButtons`: call (`actions.callShort`, `tel:<hotline_dial>`) and WhatsApp
  (`actions.whatsapp`) opening `https://wa.me/<whatsapp_digits>?text=<encoded order message>`
  (`DATA_MODEL.md` §2.1). Below `lg` they sit in the designer's fixed bottom dock.
- **Header and footer.** Header: mark, `site.name`, the page subtitle (`header.homeSubtitle` or
  `header.campaignOfferSubtitle`), and `header.labSite` opening `nel_site_url` in a new tab (omitted
  while `nel_site_url` is not set). The header is a floating pill (OD-05 item 1): fully rounded,
  12 px from the top (24 px from `md`), sticky at that inset while the page scrolls, on `surface` with
  the theme's card shadow and border, and exactly as wide as the page content below it (the same
  container and inline padding as the sections); 16 px (24 px from `md`) separate it from the first
  section (T06-F). No horizontal overflow from 320 px; below `sm` the subtitle may be
  hidden, never the mark, the site name or the lab-site button. Footer: `footer.hotline` and `footer.whatsapp` from `Campaign`
  where the designer has its page line, and the language switch.
- **Gallery preview keys.** Arrow keys follow the screen: in Arabic the left arrow goes to the next
  image, in English the right arrow does. The position line (`2 / 4`) is in `LatinRun`.
- **Gallery preview fit** (OD-04 item 7d). The image fits inside the viewport less a margin on every
  side — at least 1.5rem (`4rem` at the inline edges, where the arrows sit, from `md`) — so the
  dimmed backdrop always shows around it; a tap on the backdrop closes the preview. The image never
  covers the close button or the arrows.
- **Link preview and icons** (OD-04 item 7a–b). Every public page's head carries `og:title`,
  `og:description`, `og:type` `website`, `og:locale` (`ar_EG` or `en_US`, from `src/i18n/config.ts`),
  `og:image` `/share/nelo-share.png` with its width and height, `twitter:card`
  `summary_large_image`, and the icons of §2.1, with `metadataBase` from `NEXT_PUBLIC_SITE_URL`.
  Title: the page's existing title. Description: `home.intro` on the home page and the coming-soon
  page; `header.campaignOfferSubtitle` with the code on a CampaignOffer page. The image is the same
  on every page — never a presigned link, which expires. The dashboard sets no Open Graph tags.
- **States** (OD-03 items 2–3). Coming soon (unpublished): the full header and footer as above,
  and `home.comingSoon` in the hero's text cell. Nothing visible today: `home.nothingVisible` in the
  grid panel. Not found: status 404, the header and footer, the back link, and
  `campaignOffer.notFound` for an unknown or hidden code or `site.pageNotFound` for any other
  unknown path, in the URL's locale (§8; CF-14). Contact values not set yet (right after the
  synthetic reset): the page renders and leaves out the lab-site button, the hotline, WhatsApp and
  the action buttons that need them. Error: a page that fails to render shows our own error state
  in the theme, never the framework's built-in page (which carries an inline style the Content
  Security Policy blocks) — `site.errorMessage`, a `site.tryAgain` button and the link home, in the
  URL's locale; above the locale layout, both languages, Arabic first (CF-38).
