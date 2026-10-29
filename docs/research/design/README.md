# Approved design — reference

Evidence, not authority (`DESIGN_SYSTEM.md` §11 is the authority).

- Source: `tony-saleeb/nile` at commit `e8f6df734fcfcfa877d30c18dbebc7dcb6ddb21e`, the designer's
  implementation approved by Andrew (OD-02 item 3).
- `approved-home-top.jpg`, `approved-home-grid.jpg`, `approved-campaign-offer-page.jpg`: the
  designer's build on a local server, as sent by the human on 29 Oct 2026. Their numbers, names and
  placeholders are the designer's mock data, never offer content.
- `source/`: the designer's own files at that commit, copied byte for byte with a `.txt` suffix so
  that nothing compiles or lints them — `app/globals.css`, `app/layout.tsx`, `app/page.tsx`,
  `app/offers/[code]/page.tsx` (as `app_offers_code_page.tsx.txt`), `tailwind.config.ts` and the
  thirteen files in `components/`. The path separators became `_`. Their names, numbers and
  prices are mock data; their contact values are the laboratory's published ones (PR-11). None of
  them enters source. The
  designer's `data/` files, placeholders and banner image are not copied: the banner carries the
  laboratory's hotline and address in its pixels, and an Operator uploads it (OD-02 item 6).
