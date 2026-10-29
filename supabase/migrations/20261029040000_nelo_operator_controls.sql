-- NELO — Operator controls (DECISIONS.md OD-04 items 2 and 3): a CampaignOffer can be switched off
-- and on without being removed, and one MediaObject can be removed from one slot. Reviewer-authored.
-- Landed byte-exact by T05. Applied after 20261029030000_nelo_campaign_row_public.sql.
-- is_shown is Operator state, like the publish switch: it is not one of the nine sheet fields, the
-- import never sets it, and the offer content check does not compare it.

alter table public."CampaignOffer"
  add column is_shown boolean not null default true;

-- Visibility for Visitors now also needs is_shown (DATA_MODEL.md §3 as amended).
drop policy campaign_offer_read_visible on public."CampaignOffer";
create policy campaign_offer_read_visible on public."CampaignOffer"
  for select to anon, authenticated using (is_shown and public.campaign_offer_is_visible(starts_on, ends_on));

drop policy campaign_offer_media_read_visible on public."CampaignOfferMedia";
create policy campaign_offer_media_read_visible on public."CampaignOfferMedia"
  for select to anon, authenticated using (exists (
    select 1 from public."CampaignOffer" o
    where o.id = campaign_offer_id and o.is_shown and public.campaign_offer_is_visible(o.starts_on, o.ends_on)));

drop policy media_object_read_visible on public."MediaObject";
create policy media_object_read_visible on public."MediaObject"
  for select to anon, authenticated using (exists (
    select 1
    from public."CampaignOfferMedia" l
    join public."CampaignOffer" o on o.id = l.campaign_offer_id
    where l.media_object_id = "MediaObject".id and o.is_shown
      and public.campaign_offer_is_visible(o.starts_on, o.ends_on)));

grant select (is_shown) on public."CampaignOffer" to anon;

create function public.set_campaign_offer_shown(p_campaign_offer_id uuid, p_shown boolean) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_operator() then
    raise exception 'only an Operator can show or hide a CampaignOffer' using errcode = '42501';
  end if;
  update public."CampaignOffer" set is_shown = p_shown where id = p_campaign_offer_id;
  if not found then
    raise exception 'no such CampaignOffer' using errcode = 'P0002';
  end if;
end
$$;

-- Returns the removed object's key for deletion from R2, or null when the slot was empty.
create function public.remove_campaign_offer_media(p_campaign_offer_id uuid, p_slot text) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media_object_id uuid;
  v_object_key text;
begin
  if not public.is_operator() then
    raise exception 'only an Operator can remove a MediaObject' using errcode = '42501';
  end if;
  select l.media_object_id, m.object_key into v_media_object_id, v_object_key
  from public."CampaignOfferMedia" l
  join public."MediaObject" m on m.id = l.media_object_id
  where l.campaign_offer_id = p_campaign_offer_id and l.slot = p_slot
  for update of l;
  if v_media_object_id is null then
    return null;
  end if;
  delete from public."MediaObject" where id = v_media_object_id;
  return v_object_key;
end
$$;

-- The dashboard's status column: 'off' for a CampaignOffer an Operator switched off.
create or replace function public.campaign_offer_statuses()
returns table (campaign_offer_id uuid, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id,
    case when not o.is_shown then 'off' else public.campaign_offer_status(o.starts_on, o.ends_on) end
  from public."CampaignOffer" o
  where public.is_operator()
$$;

revoke all on function
  public.set_campaign_offer_shown(uuid, boolean),
  public.remove_campaign_offer_media(uuid, text)
from public, anon, authenticated;

grant execute on function
  public.set_campaign_offer_shown(uuid, boolean),
  public.remove_campaign_offer_media(uuid, text)
to authenticated;
