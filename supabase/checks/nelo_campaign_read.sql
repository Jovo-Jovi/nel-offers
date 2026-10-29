-- NELO — the Campaign row read (T05-F3). Reviewer-authored, read-only. Prints counts only, never a
-- contact value. Run with `node --env-file=.env.local scripts/sql/run.mjs supabase/checks/nelo_campaign_read.sql`.
-- PASS: campaign_rows 1 and campaign_row_1 1. contacts_empty is 1 right after the synthetic reset and
-- 0 once an Operator has saved the contact values.
select
  (select count(*) from public."Campaign") as campaign_rows,
  (select count(*) from public."Campaign" c where c.id = 1) as campaign_row_1,
  (select count(*) from public."Campaign" c where c.is_published) as published,
  (select count(*) from public."Campaign" c
    where c.whatsapp_digits is null and c.hotline_dial is null and c.nel_site_url is null) as contacts_empty;
