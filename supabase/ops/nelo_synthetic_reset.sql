-- NELO — synthetic reset before the real import (PHASES.md §4 step 3). Reviewer-authored. Run once by
-- the human in the Supabase SQL Editor, after every synthetic CampaignOffer and the synthetic banner
-- were removed through the dashboard (so their objects left R2), and before the laboratory's sheet
-- is imported. It refuses to run while any CampaignOffer or MediaObject row remains. It deletes the
-- synthetic CampaignImport rows, unpublishes the campaign and clears the synthetic contact values.
-- The last statement's row is the outcome; every count must be zero.
do $reset$
declare
  v_campaign_offers bigint;
  v_media_objects bigint;
begin
  select count(*) into v_campaign_offers from public."CampaignOffer";
  select count(*) into v_media_objects from public."MediaObject";
  if v_campaign_offers > 0 or v_media_objects > 0 then
    raise exception 'SYNTHETIC RESET REFUSED: % CampaignOffer and % MediaObject rows remain; remove them through the dashboard first',
      v_campaign_offers, v_media_objects;
  end if;

  delete from public."CampaignImport";
  update public."Campaign" set
    is_published = false, published_at = null, published_by = null,
    whatsapp_display = null, whatsapp_digits = null, hotline_display = null, hotline_dial = null,
    nel_site_url = null, show_card_price = true, banner_media_object_id = null
  where id = 1;
end
$reset$;

select
  (select count(*) from public."CampaignOffer") as campaign_offers,
  (select count(*) from public."CampaignImport") as campaign_imports,
  (select count(*) from public."MediaObject") as media_objects,
  (select count(*) from public."CampaignOfferMedia") as links,
  (select count(*) from public."Campaign" c where c.is_published or c.whatsapp_digits is not null
     or c.hotline_dial is not null or c.nel_site_url is not null) as campaign_not_reset;
