# NELO — Glossary

Precedence rank 1, with `PRODUCT_BRIEF.md`. The vocabulary below is enforced: a bare
forbidden noun in a table, type, route segment, field, function, component, module or file
name is a **defect**, caught by `guard:naming` (§4).

## 1. Entities

Exact PascalCase names. They are the only permitted spellings of these ideas.

| Entity | Meaning | Table |
|---|---|---|
| **Campaign** | The opening campaign. One record. Holds the publish switch and the laboratory's contact values. | `"Campaign"` |
| **CampaignOffer** | One analysis on offer in the campaign, keyed by its code. | `"CampaignOffer"` |
| **CampaignImport** | One confirmed import of the Excel sheet: the sheet's hash and its parsed rows, kept for the offer content check. | `"CampaignImport"` |
| **MediaObject** | One image or video stored in the R2 bucket. | `"MediaObject"` |
| **CampaignOfferMedia** | The link between a `CampaignOffer` and a `MediaObject`, in one slot. | `"CampaignOfferMedia"` |
| **Operator** | A laboratory staff member who signs in to the dashboard. | `"Operator"` |
| **Visitor** | Anyone using the public site. Never stored. | — |

## 2. Terms

| Term | Meaning |
|---|---|
| **Analysis** | A laboratory analysis, in prose only. Never an identifier. |
| **code** | The key of a `CampaignOffer`, as the laboratory writes it (e.g. `OFF-001`). Compared without regard to letter case. |
| **sheet** | A filled copy of `NELO_offers_template.xlsx`. Sheet `Offers`, nine fixed columns. |
| **template** | The empty sheet the dashboard serves, byte-identical to `assets/templates/NELO_offers_template.xlsx`. |
| **export** | The current `CampaignOffer`s written into the template's format. |
| **preview** | The dashboard's view of a sheet before it is applied: errors, additions, updates, unchanged rows. |
| **confirm** | The Operator's action that applies a previewed sheet and records a `CampaignImport`. |
| **slot** | Where a `MediaObject` sits on a `CampaignOffer`: `main_video`, `main_image`, `gallery_1`, `gallery_2`, `gallery_3`. |
| **visibility window** | The dates between a `CampaignOffer`'s `starts_on` (or no start) and its `ends_on`, inclusive, in Cairo time. |
| **visible** | A `CampaignOffer` is visible when the `Campaign` is published and today is inside its visibility window. |
| **publish switch** | `Campaign.is_published`. One switch for the whole campaign. |
| **contact values** | WhatsApp display and digits, hotline display and dial string, NEL site URL. Business values; they live only in `Campaign`. |
| **spec** | A software test file. |

## 3. Forbidden bare nouns

```
test · result · patient · offer · item · content · user · admin · file · media
```

| Forbidden | Use instead |
|---|---|
| `test` | **Analysis** in prose; never an identifier. `spec` for a software test. |
| `result` · `patient` | **Forbidden.** The system holds no results and no patients. Choose another word (`outcome`, `verdict`, `response`). |
| `offer` | `CampaignOffer`. The campaign itself is `Campaign`. |
| `file` · `media` | `MediaObject`, linked by `CampaignOfferMedia`. For the browser's upload object, `uploadCandidate` or `sheetUpload`. |
| `user` · `admin` | `Operator` (dashboard) or `Visitor` (public). |
| `item` · `content` | Name the entity. |

**Permitted forms.** The entity names above in camelCase, snake_case and kebab-case
(`campaignOfferId`, `campaign_offer_id`, `/campaign-offers/`, `media_object_id`,
`/operator/media-objects`). `content_type` / `contentType` / `ContentType` as the HTTP header
name. Third-party API names at call sites (`supabase.auth.getUser()`, Playwright's `test()`,
`localStorage.getItem`) and tool-mandated file names and keys (`package.json`,
`dependencies`, `next.config.ts`) are outside the rule; a name **we declare** is inside it,
including a destructured binding (`const { data: { user } }` is a defect — bind it as
`operatorAccount`).

## 4. `guard:naming` — what it certifies

Scope: names we choose in `src/**`, `supabase/**`, `scripts/**`, `e2e/**` —
file and directory names, route segments under `src/app/**`, declared identifiers in `.ts`,
`.tsx`, `.mjs` (`type`, `interface`, `class`, `enum`, `function`, `const`, `let`, `var`,
parameters, destructured bindings, object-literal keys of our own types), and SQL
identifiers in `supabase/migrations/**` (tables, columns, functions, policies, indexes).

Method: split each name into words at case, `_`, `-` and `.` boundaries and lower-case them.
Remove every occurrence of a permitted compound (`campaign offer media`, then `campaign offer`,
`media object`, `content type`, with a plural `s` on the last word allowed). Any forbidden word
left — singular or plural (`offers`, `files`, `items`, `results`) — fails. So
`campaignOfferId` passes and `campaignOfferItem` and `mediaObjectFile` fail.

Certification: the guard exits 0 on the repository, and its `--self-check` mode runs a
built-in list of must-fail and must-pass names through the same matcher twice — once as
strings and once as files written to a temporary directory outside the repository — and
prints both counts. A stdin pass does not certify file-mode scope.
