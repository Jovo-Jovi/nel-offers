# NELO — Session Context

Read at the start of every reviewer and builder session, with `docs/method/PRECEDENTS.md`.
State is taken from this file and the repository, never from conversation.

## Now

| | |
|---|---|
| Phase | P04 Public site and go-live |
| Task in flight | T11 — A banner the phone holds back (`t11-banner-held`, OD-10) |
| Next | Go-live with the human (`PHASES.md` §4), staging on the Vercel address first |
| Last verdict | T10 — PASS, 31 Oct 2026 (PR #15 merged). Since 30 Oct the project holds the laboratory's real data: no build fence writes to it (`PRECEDENTS.md`, "Production data") |
| Deadline | live by 30 Oct 2026 |
| Scope | frozen by OD-01 (`DECISIONS.md`) |

## Fixed facts

- Repository `Jovo-Jovi/nel-offers`, default branch `main`. Public from T01 until go-live, then
  private (OD-01 item 2); every write task checks the visibility first. Public-repository rules
  bind every commit.
- Accounts held by the human: Vercel Hobby, project `nel-offers`, region `fra1` (OD-02 item 2); Supabase project in Central EU
  (Frankfurt, `eu-central-1`); Cloudflare R2 bucket `nel-offers-media`, private, no custom domain, with a
  bucket-scoped read/write token. No key, URL with a key, or connection string is ever written
  into this repository or a chat.
- Address at go-live: `offers.nileegyptlabs.com`, one CNAME at GoDaddy.
- NEL artefacts: `src/styles/tokens.css` and `public/mark/nel-mark.png` only, at the hashes in
  `DESIGN_SYSTEM.md` §2.
- Design: the designer's implementation at `tony-saleeb/nile` `e8f6df73`, approved by Andrew
  (OD-02 item 3; `DESIGN_SYSTEM.md` §11).
- Review: no Opus review (OD-02 item 1); the reviewer verifies every branch.
- SQL: reviewer-authored files run through `npm run sql` (OD-04 item 1; `SECURITY_MODEL.md` §2.1)
  or by the human in the SQL Editor. The connection string lives only in the builder machine's
  `.env.local`.
- Template: `assets/templates/NELO_offers_template.xlsx`, SHA-256
  `23f88b52710d3bc283086a955ae405b018165247afd0595739600cc4bcc18fa1`.
- Usage: every run is recorded by the next fence (`PHASES.md` §5); totals in
  `docs/usage/README.md`.

## Open dependencies

All in `docs/method/CARRY_FORWARDS.md`. The ones that can stop go-live: the real sheet, the
real media, copy confirmation, the designer's files before T04, the Operator account holders,
DNS access.

## Reading order

1. This file and `docs/method/PRECEDENTS.md` — every session.
2. The task's own "Context to read first".
3. `docs/method/CARRY_FORWARDS.md` — when a row is named, changes, or at a gate.
4. `docs/DEVELOPMENT_JOURNAL.md` — on demand.
