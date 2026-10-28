# NELO — Carry-forwards

Findings and dependencies that outlive the task that found them. A row is described by the
reviewer and numbered by the task that lands it, from the live maximum. A row closes only at a
verdict, with the evidence named: its Status cell becomes `CLOSED (<task>)`, and no other
cell of any row is ever edited. Closed rows stay.

**Next free id: CF-15**

| Id | Item | Owner | Opened | Blocks | Status |
|---|---|---|---|---|---|
| CF-01 | `Jovo-Jovi/nel-offers` is public from T01 until go-live (OD-01 item 2), so GitHub Actions is not limited. The laboratory's material in it — the blueprint, the template, the mark, the contact values below — is world-readable meanwhile and stays so in any copy taken. Andrew has not been asked whether that is acceptable. The repository returns to private at go-live. | the human | 2026-10-28 | go-live | OPEN |
| CF-02 | The design pack's header reads "دليل العروض الإلكترونية — Lab to Lab" and "عروض مخصصة للمعامل والأطباء" (offers for laboratories and doctors). The brief's audience is every Visitor. The line is not used until Andrew confirms the audience. | Andrew (laboratory) | 2026-10-28 | T04 copy | OPEN |
| CF-03 | UI copy marked "draft" in `DESIGN_SYSTEM.md` §9 — every English string, and the Arabic strings with no pack source — awaits Andrew's confirmation. | Andrew (laboratory) | 2026-10-28 | go-live | OPEN |
| CF-04 | The designer's files (the Canva design pack and any UI files) are not in the repository. They land in `docs/research/` with their SHA-256 before T04 is issued. | the human | 2026-10-28 | T04 | OPEN |
| CF-05 | The laboratory's real sheet has not been received. | Andrew (laboratory) | 2026-10-28 | go-live | OPEN |
| CF-06 | The laboratory's real videos and images have not been received. | Andrew (laboratory) | 2026-10-28 | go-live | OPEN |
| CF-07 | Contact values shown in the design pack — WhatsApp 01278616166, hotline 15504 — to be confirmed current by Andrew and entered by an Operator in Campaign settings. Never in source. | Andrew (laboratory) · Operator | 2026-10-28 | publish switch | OPEN |
| CF-08 | The NEL site address to link to is not confirmed. | Andrew (laboratory) | 2026-10-28 | publish switch | OPEN |
| CF-09 | Access to the GoDaddy DNS for `nileegyptlabs.com` — who holds it, and when the `offers` CNAME can be added. | the human · Andrew (laboratory) | 2026-10-28 | go-live | OPEN |
| CF-10 | The one or two Operator account holders are not named. The human creates their accounts after T02 and delivers access outside the repository. | Andrew (laboratory) · the human | 2026-10-28 | go-live | OPEN |
| CF-11 | `guard:literals` reports only the first match per rule in each file. Certification holds — any violation fails the run — but a report can hide further findings. Fixed by T02. | builder | 2026-10-28 | T02 | OPEN |
| CF-12 | `guard:design` does not read physical properties in JSX `style` objects (`marginLeft`), and its `dir=` rule also matches a variable named `dir`. `DESIGN_SYSTEM.md` §7 amended by T02; guard fixed by T02. | reviewer · builder | 2026-10-28 | T02 | OPEN |
| CF-13 | `guard:naming` reads SQL comments and string literals and flags the platform's `auth.users`, so the reviewer-authored migration fails it. `GLOSSARY.md` §4 amended by T02; guard fixed by T02. | reviewer · builder | 2026-10-28 | T02 | OPEN |
| CF-14 | Not-found responses (`/fr`, `/en/fr`, an unknown code) render the framework page: no `lang`, no `dir`, no catalogue copy. `DESIGN_SYSTEM.md` §8 requires a not-found state in the page's locale. | builder | 2026-10-28 | T04 | OPEN |
