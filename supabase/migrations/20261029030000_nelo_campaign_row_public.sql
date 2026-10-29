-- NELO — Visitors read the Campaign row while the campaign is unpublished, so the coming-soon page
-- shows the lab-site link and the footer contacts (DECISIONS.md OD-03 item 2). Reviewer-authored.
-- Landed byte-exact by T05. Applied once by the human in the Supabase SQL Editor, after
-- 20261029020000_nelo_import_conflict.sql.
-- Column grants are unchanged: anon still reads only id, is_published, the five contact values,
-- show_card_price and banner_media_object_id. CampaignOffer, CampaignOfferMedia and the banner
-- MediaObject stay hidden until the campaign is published.
drop policy campaign_read_published on public."Campaign";

create policy campaign_read_public on public."Campaign"
  for select to anon, authenticated using (true);
