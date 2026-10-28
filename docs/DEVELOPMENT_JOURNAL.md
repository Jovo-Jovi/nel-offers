# NELO — Development Journal

Newest entry last. One entry per session or task: what happened, what was found, what is next.
Facts here are history; current state is in `SESSION_CONTEXT.md`.

## 2026-10-28 — Reviewer session 1 (blueprint)

- Fetched `Jovo-Jovi/nel-offers`: empty, no refs. An anonymous `git ls-remote` succeeded, so
  the repository was publicly readable; logged as a carry-forward and made a precondition of
  every push.
- Read the template: sheet `Offers` with the nine fixed headers and its data validations; the
  read-me sheet defines required columns, Cairo-time `ends_on`, row-order fallback for
  `display_order`, and deletion in the dashboard.
- Read the design pack (text): home with search and numbered cards; one page per code with
  video, price, end date, conditions, three images, WhatsApp, call and order.
- Copied NEL's `tokens.css` and mark into the bundle at NEL commit `b95a75b3`, with hashes.
- Wrote the blueprint and OD-01; issued T01 to land them once OD-01 is signed.

## 2026-10-28 — Reviewer session 1, amendment before signature

- The human reported the Supabase project is in Frankfurt (`eu-central-1`), not Zurich;
  OD-01 item 1 corrected.
- Repository confirmed private, `main` with one empty commit, no files (fetched with session
  access). The human will make it public until go-live for GitHub Actions; OD-01 item 2
  rewritten, public-repository rules added as precedents.
- Usage ledger added (`PHASES.md` §5, OD-01 item 19); T01 builds it and records the
  blueprint runs.
