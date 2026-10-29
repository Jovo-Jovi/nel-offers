-- NELO — campaign presentation settings: the card-price switch and the campaign banner.
-- Reviewer-authored (DECISIONS.md OD-02 items 5–6, DATA_MODEL.md §§2.1 and 3, ADMIN_SPEC.md §3). Landed byte-exact
-- by T03. Applied once by the human in the Supabase SQL Editor, after 20261029000000_nelo_initial.sql.

alter table public."Campaign"
  add column show_card_price boolean not null default true,
  add column banner_media_object_id uuid unique
    references public."MediaObject" (id) on delete set null;

create function public.campaign_banner_kind_check() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kind text;
begin
  if new.banner_media_object_id is null then
    return new;
  end if;
  select m.kind into v_kind from public."MediaObject" m where m.id = new.banner_media_object_id;
  if v_kind is distinct from 'image' then
    raise exception 'the campaign banner must be an image' using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger campaign_banner_kind
  before update of banner_media_object_id on public."Campaign"
  for each row execute function public.campaign_banner_kind_check();

create function public.attach_campaign_banner(
  p_object_key text,
  p_content_type text,
  p_byte_size bigint
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous_id uuid;
  v_previous_key text;
  v_new_id uuid;
begin
  if not public.is_operator() then
    raise exception 'only an Operator can set the campaign banner' using errcode = '42501';
  end if;
  select c.banner_media_object_id, m.object_key into v_previous_id, v_previous_key
  from public."Campaign" c
  left join public."MediaObject" m on m.id = c.banner_media_object_id
  where c.id = 1
  for update of c;

  insert into public."MediaObject" (object_key, kind, content_type, byte_size)
  values (p_object_key, 'image', p_content_type, p_byte_size)
  returning id into v_new_id;
  update public."Campaign" set banner_media_object_id = v_new_id where id = 1;
  if v_previous_id is not null then
    delete from public."MediaObject" where id = v_previous_id;
  end if;

  return v_previous_key;
end
$$;

create function public.remove_campaign_banner() returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous_id uuid;
  v_previous_key text;
begin
  if not public.is_operator() then
    raise exception 'only an Operator can remove the campaign banner' using errcode = '42501';
  end if;
  select c.banner_media_object_id, m.object_key into v_previous_id, v_previous_key
  from public."Campaign" c
  left join public."MediaObject" m on m.id = c.banner_media_object_id
  where c.id = 1
  for update of c;
  if v_previous_id is null then
    return null;
  end if;
  update public."Campaign" set banner_media_object_id = null where id = 1;
  delete from public."MediaObject" where id = v_previous_id;
  return v_previous_key;
end
$$;

-- Status of every CampaignOffer for the dashboard, from the one visibility function (DATA_MODEL.md §3).
create function public.campaign_offer_statuses()
returns table (campaign_offer_id uuid, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, public.campaign_offer_status(o.starts_on, o.ends_on)
  from public."CampaignOffer" o
  where public.is_operator()
$$;

create policy media_object_read_banner on public."MediaObject"
  for select to anon, authenticated using (exists (
    select 1 from public."Campaign" c
    where c.id = 1 and c.is_published and c.banner_media_object_id = "MediaObject".id));

grant select (show_card_price, banner_media_object_id) on public."Campaign" to anon;
grant update (show_card_price) on public."Campaign" to authenticated;

revoke all on function
  public.campaign_banner_kind_check(),
  public.attach_campaign_banner(text, text, bigint),
  public.remove_campaign_banner(),
  public.campaign_offer_statuses()
from public, anon, authenticated;

grant execute on function
  public.attach_campaign_banner(text, text, bigint),
  public.remove_campaign_banner(),
  public.campaign_offer_statuses()
to authenticated;
