# NELO — Security Model

Precedence rank 4. Everything in §§2–3 and §§5–6 is **Risk 3**: reviewer-authored SQL and configuration,
reviewer rehearsal, Opus review before merge (T02).

## 1. Secrets

| Name | Where it lives | Exposed to the browser |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel env, `.env.local` | Yes (by design) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel env, `.env.local` | Yes (by design; RLS is the control) |
| `R2_ACCOUNT_ID` | Vercel env, `.env.local` | No |
| `R2_ACCESS_KEY_ID` | Vercel env, `.env.local` | No |
| `R2_SECRET_ACCESS_KEY` | Vercel env, `.env.local` | No |
| `R2_BUCKET` | Vercel env, `.env.local` | No |
| `NEXT_PUBLIC_SITE_URL` | Vercel env, `.env.local` | Yes |

- No Supabase secret (service-role) key is used by the application. Operator actions run under
  the Operator's own session and RLS; public reads run under the publishable key and RLS.
- `.env.example` lists the names with empty values. `.env*` other than `.env.example` is
  git-ignored. The human enters values in Vercel and in the local `.env.local`; values never
  appear in a commit, a prompt, a report or this chat. While the repository is public, the
  Supabase project reference and URL are treated as values too.
- GitHub secret scanning with push protection is on for the repository (the human enables it;
  it is free while the repository is public).
- Server-only modules that read `R2_*` import `server-only`.

## 2. Database (Supabase)

- **RLS on every table, deny by default.** No policy grants `anon` or `authenticated` more
  than its row below.
- **Operator check** — a `security definer` function `is_operator()` returns true only when
  `auth.uid()` is in `"Operator"` **and** the JWT's `aal` claim is `aal2`. Every Operator policy
  uses it.
- **Public reads** — `anon` may select a `CampaignOffer` only when it is visible
  (`DATA_MODEL.md` §3), the published `Campaign` contact values, and the `CampaignOfferMedia`
  and `MediaObject` rows linked to a visible `CampaignOffer`. Nothing else.
- **Writes** — only through `is_operator()`. `"CampaignImport"` is insert-only (no update or
  delete policy). `"Operator"` has no write policy at all; the human inserts rows in the SQL
  Editor.
- Functions are `security definer` with `set search_path = ''` and fully qualified names.
- The migration lands byte-exact from reviewer-authored SQL; the human applies it.

## 3. Operator sign-in

- Supabase Auth, email and password; **sign-ups disabled** in the project settings.
- **TOTP mandatory.** A session at `aal1` reaches only the enrol and verify screens. The
  dashboard's server code checks the assurance level on every request, and RLS checks it again.
- Sessions via `@supabase/ssr` cookies. Only responses on dashboard paths (`/operator/...`,
  `/en/operator/...`) and Operator route handlers set them, and the request proxy refreshes the
  session only on those paths. The cookies keep the library's default path `/`, because the
  dashboard spans two locale prefixes; public pages never read them. A Visitor who never signs
  in never receives one.
- No email flows. Password reset and lost-TOTP recovery are done by the human in the Supabase
  dashboard.
- Supabase Auth's built-in rate limits stand; they are not raised.
- Minimum password length 12, set by the human in the email provider's settings.

## 4. Sheet handling

- `.xlsx` only, at most 2 MB, read with `exceljs` on the server inside an Operator-only
  server action. Sheet `Offers` only; formulas are read as their cached values; any non-empty
  cell beyond column I or below row 501 is an error (`DATA_MODEL.md` §4.1).
- The parsed rows, not the workbook, are stored (`"CampaignImport".sheet_rows`), with the
  workbook's SHA-256.

## 5. R2 storage

- Bucket `nel-offers-media`: private; no `r2.dev` public access; no custom domain.
- Credentials: the bucket-scoped read/write token, server-only (§1).
- **Route handlers.** The presign and finalise handlers live under `src/app/api/operator/**`
  and refuse any caller that is not `is_operator()` at `aal2`.
- **Upload.** The browser checks the selected file against `DECISIONS.md` OD-01 item 10
  (format and size as selected) and re-encodes images. The Operator-only route handler then
  validates the parsed name and the object about to be sent — `video/mp4` at most 100 MB, or
  `image/webp` at most 10 MB after re-encoding — chooses the key `media/<uuid>.<ext>`, and returns a
  presigned `PUT` signed over `Content-Type` and `Content-Length`, valid 10 minutes. After the
  browser reports success, the server reads the object's head; only a match records the
  `MediaObject` and its link.
- **View.** Public pages presign `GET` URLs, valid 60 minutes, for `MediaObject`s linked to a
  visible `CampaignOffer` only.
- **CORS** on the bucket: `PUT` and `GET` from the production origin, the Vercel production
  alias and `http://localhost:3000` only; headers `Content-Type` and `Content-Length`.
  Reviewer-authored JSON in T02; the human applies it.
- **Removal.** Removing a `CampaignOffer`, or replacing a slot, deletes the superseded objects.

## 6. HTTP headers

Set for every response, with a nonce-based Content Security Policy:

- `Content-Security-Policy`: `default-src 'self'`; scripts `'self'` plus the per-request
  nonce; `img-src` `'self'`, `data:` (the TOTP enrolment QR code), `blob:` (upload previews)
  and the R2 endpoint host; `media-src` `'self'` and the R2 endpoint host; `connect-src` `'self'`,
  the Supabase URL and the R2 endpoint host; `frame-ancestors 'none'`; `form-action 'self'`;
  `base-uri 'self'`; `object-src 'none'`.
- `Strict-Transport-Security: max-age=63072000`, without `includeSubDomains` or `preload`:
  those would bind every host of the laboratory's domain, which is not ours to decide.
- `X-Content-Type-Options: nosniff` · `Referrer-Policy: strict-origin-when-cross-origin` ·
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- Dashboard responses: `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`.

## 7. Dependencies and CI

- CI on every push: `npm ci`, `npm audit --omit=dev --audit-level=high`, the four guards and
  their self-checks, the usage report check, lint, typecheck, build. CI reads no secret.
- `pull_request_target` is never used. A `pull_request` job runs only when
  `github.event.pull_request.head.repo.full_name == github.repository`, so code from a fork is
  never checked out. `permissions: contents: read`.
- A new dependency is named in its task prompt with the reason the platform cannot do the job.
