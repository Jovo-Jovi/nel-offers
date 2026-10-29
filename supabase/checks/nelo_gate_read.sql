-- NELO — the gate read (DATA_MODEL.md §§5 and 9; PHASES.md §3). Reviewer-authored, read-only.
-- Run with `npm run sql -- supabase/checks/nelo_gate_read.sql` or in the Supabase SQL Editor.
-- PASS: drift 0, orphans 0, media_objects equal to the media scan's objects; not_synthetic 0 until
-- the laboratory's real sheet is imported. switched_off counts CampaignOffers an Operator switched off.
select
  (select count(*) from public.campaign_offer_drift()) as drift,
  (select count(*) from public."CampaignOffer") as campaign_offers,
  (select count(*) from public."CampaignOffer" o where o.code_key not like 'SYN-%') as not_synthetic,
  (select count(*) from public."CampaignOffer" o where not o.is_shown) as switched_off,
  (select count(*) from public."MediaObject") as media_objects,
  (select count(*) from public."MediaObject" m
    where not exists (select 1 from public."CampaignOfferMedia" l where l.media_object_id = m.id)
      and not exists (select 1 from public."Campaign" c where c.banner_media_object_id = m.id)) as orphans;
