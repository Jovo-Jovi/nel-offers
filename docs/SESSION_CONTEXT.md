# NELO — Session Context

Read at the start of every reviewer and builder session, with `docs/method/PRECEDENTS.md`.
State is taken from this file and the repository, never from conversation.

## Now

| | |
|---|---|
| Phase | P02 Data, sign-in, storage |
| Task in flight | T02 — Data, Operator sign-in, storage, headers (`t02-data-auth-storage`) |
| Next | T03 — Operator dashboard |
| Last verdict | T01 — PASS, 28 Oct 2026 |
| Deadline | live by 30 Oct 2026 |
| Scope | frozen by OD-01 (`DECISIONS.md`) |

## Fixed facts

- Repository `Jovo-Jovi/nel-offers`, default branch `main`. Public from T01 until go-live, then
  private (OD-01 item 2); every write task checks the visibility first. Public-repository rules
  bind every commit.
- Accounts held by the human: Vercel Pro (no project yet); Supabase project in Central EU
  (Frankfurt, `eu-central-1`); Cloudflare R2 bucket `nel-offers-media`, private, no custom domain, with a
  bucket-scoped read/write token. No key, URL with a key, or connection string is ever written
  into this repository or a chat.
- Address at go-live: `offers.nileegyptlabs.com`, one CNAME at GoDaddy.
- NEL artefacts: `src/styles/tokens.css` and `public/mark/nel-mark.png` only, at the hashes in
  `DESIGN_SYSTEM.md` §2.
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
