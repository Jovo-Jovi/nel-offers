-- NELO — initial schema.
-- Reviewer-authored (DATA_MODEL.md §§2–5, §9; SECURITY_MODEL.md §2). Landed byte-exact by T02.
-- Applied once by the human in the Supabase SQL Editor. Never edited; a change is a new migration.

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

create table public."Operator" (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public."Campaign" (
  id smallint primary key default 1 check (id = 1),
  is_published boolean not null default false,
  published_at timestamptz,
  published_by uuid references public."Operator" (id) on delete set null,
  whatsapp_display text check (whatsapp_display is null
    or (whatsapp_display = btrim(whatsapp_display) and whatsapp_display <> '' and char_length(whatsapp_display) <= 32)),
  whatsapp_digits text check (whatsapp_digits is null or whatsapp_digits ~ '^[1-9][0-9]{7,14}$'),
  hotline_display text check (hotline_display is null
    or (hotline_display = btrim(hotline_display) and hotline_display <> '' and char_length(hotline_display) <= 32)),
  hotline_dial text check (hotline_dial is null or hotline_dial ~ '^\+?[0-9]{3,15}$'),
  nel_site_url text check (nel_site_url is null
    or (nel_site_url ~ '^https://[^[:space:]]+$' and char_length(nel_site_url) <= 200)),
  updated_at timestamptz not null default now(),
  constraint campaign_publish_needs_contacts check (
    not is_published
    or (whatsapp_display is not null and whatsapp_digits is not null and hotline_display is not null
        and hotline_dial is not null and nel_site_url is not null))
);

insert into public."Campaign" (id) values (1);

create table public."CampaignImport" (
  id uuid primary key default gen_random_uuid(),
  sheet_sha256 text not null check (sheet_sha256 ~ '^[0-9a-f]{64}$'),
  sheet_rows jsonb not null check (jsonb_typeof(sheet_rows) = 'array'),
  row_count integer not null check (row_count between 1 and 500),
  added_count integer not null check (added_count >= 0),
  updated_count integer not null check (updated_count >= 0),
  unchanged_count integer not null check (unchanged_count >= 0),
  confirmed_at timestamptz not null default now(),
  confirmed_by uuid references public."Operator" (id) on delete set null,
  constraint campaign_import_counts check (added_count + updated_count + unchanged_count = row_count)
);

create table public."CampaignOffer" (
  id uuid primary key default gen_random_uuid(),
  code text not null check (code ~ '^[A-Za-z0-9-]{2,20}$'),
  code_key text generated always as (upper(code)) stored,
  name_ar text not null check (name_ar = btrim(name_ar) and char_length(name_ar) between 1 and 200),
  name_en text not null check (name_en = btrim(name_en) and char_length(name_en) between 1 and 200),
  price_egp numeric(12, 2) not null check (price_egp >= 0),
  starts_on date,
  ends_on date not null,
  conditions_ar text check (conditions_ar is null
    or (conditions_ar = btrim(conditions_ar) and char_length(conditions_ar) between 1 and 2000)),
  conditions_en text check (conditions_en is null
    or (conditions_en = btrim(conditions_en) and char_length(conditions_en) between 1 and 2000)),
  display_order integer check (display_order is null or display_order >= 0),
  sheet_row integer not null check (sheet_row between 2 and 501),
  last_import_id uuid not null references public."CampaignImport" (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_offer_code_key_unique unique (code_key),
  constraint campaign_offer_window check (starts_on is null or starts_on <= ends_on),
  constraint campaign_offer_date_floor check (ends_on > date '2026-01-01'
    and (starts_on is null or starts_on > date '2026-01-01')),
  constraint campaign_offer_conditions_pair check ((conditions_ar is null) = (conditions_en is null))
);

create table public."MediaObject" (
  id uuid primary key default gen_random_uuid(),
  object_key text not null unique check (object_key ~ '^media/[0-9a-f-]{36}\.(mp4|webp)$'),
  kind text not null check (kind in ('video', 'image')),
  content_type text not null,
  byte_size bigint not null check (byte_size > 0),
  created_at timestamptz not null default now(),
  constraint media_object_kind_limits check (
    (kind = 'video' and content_type = 'video/mp4' and object_key like '%.mp4' and byte_size <= 104857600)
    or (kind = 'image' and content_type = 'image/webp' and object_key like '%.webp' and byte_size <= 10485760))
);

create table public."CampaignOfferMedia" (
  campaign_offer_id uuid not null references public."CampaignOffer" (id) on delete cascade,
  media_object_id uuid not null unique references public."MediaObject" (id) on delete cascade,
  slot text not null check (slot in ('main_video', 'main_image', 'gallery_1', 'gallery_2', 'gallery_3')),
  primary key (campaign_offer_id, slot)
);

-- ---------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------

create function public.campaign_offer_media_kind_check() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_kind text;
begin
  select m.kind into v_kind from public."MediaObject" m where m.id = new.media_object_id;
  if v_kind is not null and (new.slot = 'main_video') <> (v_kind = 'video') then
    raise exception 'slot % cannot hold a % MediaObject', new.slot, v_kind using errcode = '23514';
  end if;
  return new;
end
$$;

create trigger campaign_offer_media_kind
  before insert or update on public."CampaignOfferMedia"
  for each row execute function public.campaign_offer_media_kind_check();

create function public.campaign_touch() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger campaign_touch
  before update on public."Campaign"
  for each row execute function public.campaign_touch();

-- ---------------------------------------------------------------------------------------------
-- Visibility (DATA_MODEL.md §3) and the Operator check (SECURITY_MODEL.md §2)
-- ---------------------------------------------------------------------------------------------

create function public.campaign_today() returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Cairo')::date
$$;

create function public.campaign_offer_status(p_starts_on date, p_ends_on date) returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not coalesce((select c.is_published from public."Campaign" c where c.id = 1), false) then 'hidden'
    when p_starts_on is not null and p_starts_on > public.campaign_today() then 'scheduled'
    when p_ends_on < public.campaign_today() then 'ended'
    else 'visible'
  end
$$;

create function public.campaign_offer_is_visible(p_starts_on date, p_ends_on date) returns boolean
language sql
stable
set search_path = ''
as $$
  select public.campaign_offer_status(p_starts_on, p_ends_on) = 'visible'
$$;

create function public.is_operator() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2'
     and exists (select 1 from public."Operator" o where o.id = (select auth.uid()))
$$;

-- ---------------------------------------------------------------------------------------------
-- Import (DATA_MODEL.md §4.4): one transaction, all or nothing
-- ---------------------------------------------------------------------------------------------

create function public.apply_campaign_import(
  p_sheet_sha256 text,
  p_rows jsonb,
  p_expected_count integer,
  p_expected_updated_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_import_id uuid;
  v_count integer;
  v_updated_at timestamptz;
  v_row_count integer;
  v_added integer;
  v_updated integer;
begin
  if not public.is_operator() then
    raise exception 'only an Operator can confirm an import' using errcode = '42501';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'rows must be a JSON array' using errcode = '22023';
  end if;
  v_row_count := jsonb_array_length(p_rows);
  if v_row_count < 1 or v_row_count > 500 then
    raise exception 'a sheet holds 1 to 500 rows, not %', v_row_count using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_rows) e
    where jsonb_typeof(e) <> 'object'
       or (select array_agg(k order by k) from jsonb_object_keys(e) k)
          <> array['code', 'conditions_ar', 'conditions_en', 'display_order', 'ends_on',
                   'name_ar', 'name_en', 'price_egp', 'sheet_row', 'starts_on']
       or jsonb_typeof(e -> 'code') <> 'string'
       or jsonb_typeof(e -> 'name_ar') <> 'string'
       or jsonb_typeof(e -> 'name_en') <> 'string'
       or jsonb_typeof(e -> 'price_egp') <> 'string'
       or (e ->> 'price_egp') !~ '^[0-9]{1,10}\.[0-9]{2}$'
       or jsonb_typeof(e -> 'ends_on') <> 'string'
       or (e ->> 'ends_on') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
       or jsonb_typeof(e -> 'starts_on') not in ('string', 'null')
       or (jsonb_typeof(e -> 'starts_on') = 'string' and (e ->> 'starts_on') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
       or jsonb_typeof(e -> 'conditions_ar') not in ('string', 'null')
       or jsonb_typeof(e -> 'conditions_en') not in ('string', 'null')
       or jsonb_typeof(e -> 'display_order') not in ('number', 'null')
       or (jsonb_typeof(e -> 'display_order') = 'number' and (e ->> 'display_order') !~ '^[0-9]+$')
       or jsonb_typeof(e -> 'sheet_row') <> 'number'
       or (e ->> 'sheet_row') !~ '^[0-9]+$'
  ) then
    raise exception 'each row carries exactly the ten keys of DATA_MODEL.md §4.3, in their formats'
      using errcode = '22023';
  end if;

  lock table public."CampaignOffer" in share row exclusive mode;
  select count(*), max(o.updated_at) into v_count, v_updated_at from public."CampaignOffer" o;
  if v_count <> p_expected_count or v_updated_at is distinct from p_expected_updated_at then
    raise exception 'the campaign changed since this preview — preview again' using errcode = '40001';
  end if;

  drop table if exists pg_temp.nelo_incoming;
  create temporary table nelo_incoming on commit drop as
    select r.*
    from jsonb_to_recordset(p_rows) as r(
      sheet_row integer, code text, name_ar text, name_en text, price_egp numeric(12, 2),
      starts_on date, ends_on date, conditions_ar text, conditions_en text, display_order integer);

  if exists (select 1 from pg_temp.nelo_incoming i group by upper(i.code) having count(*) > 1) then
    raise exception 'a code appears twice in the sheet' using errcode = '23505';
  end if;
  if exists (select 1 from pg_temp.nelo_incoming i group by i.sheet_row having count(*) > 1) then
    raise exception 'a sheet row appears twice' using errcode = '23505';
  end if;

  select
    count(*) filter (where o.id is null),
    count(*) filter (where o.id is not null and (
      o.code is distinct from i.code or o.name_ar is distinct from i.name_ar
      or o.name_en is distinct from i.name_en or o.price_egp is distinct from i.price_egp
      or o.starts_on is distinct from i.starts_on or o.ends_on is distinct from i.ends_on
      or o.conditions_ar is distinct from i.conditions_ar or o.conditions_en is distinct from i.conditions_en
      or o.display_order is distinct from i.display_order))
  into v_added, v_updated
  from pg_temp.nelo_incoming i
  left join public."CampaignOffer" o on o.code_key = upper(i.code);

  insert into public."CampaignImport" (
    sheet_sha256, sheet_rows, row_count, added_count, updated_count, unchanged_count, confirmed_by)
  values (
    p_sheet_sha256, p_rows, v_row_count, v_added, v_updated, v_row_count - v_added - v_updated,
    (select auth.uid()))
  returning id into v_import_id;

  insert into public."CampaignOffer" as o (
    code, name_ar, name_en, price_egp, starts_on, ends_on, conditions_ar, conditions_en,
    display_order, sheet_row, last_import_id)
  select
    i.code, i.name_ar, i.name_en, i.price_egp, i.starts_on, i.ends_on, i.conditions_ar,
    i.conditions_en, i.display_order, i.sheet_row, v_import_id
  from pg_temp.nelo_incoming i
  on conflict (code_key) do update set
    code = excluded.code,
    name_ar = excluded.name_ar,
    name_en = excluded.name_en,
    price_egp = excluded.price_egp,
    starts_on = excluded.starts_on,
    ends_on = excluded.ends_on,
    conditions_ar = excluded.conditions_ar,
    conditions_en = excluded.conditions_en,
    display_order = excluded.display_order,
    sheet_row = excluded.sheet_row,
    last_import_id = excluded.last_import_id,
    updated_at = now();

  return v_import_id;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- MediaObject link, CampaignOffer removal, publish switch (ADMIN_SPEC.md §§3, 5, 7)
-- ---------------------------------------------------------------------------------------------

create function public.attach_media_object(
  p_code text,
  p_slot text,
  p_object_key text,
  p_kind text,
  p_content_type text,
  p_byte_size bigint
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign_offer_id uuid;
  v_previous_id uuid;
  v_previous_key text;
  v_new_id uuid;
begin
  if not public.is_operator() then
    raise exception 'only an Operator can link a MediaObject' using errcode = '42501';
  end if;
  select o.id into v_campaign_offer_id from public."CampaignOffer" o where o.code_key = upper(p_code);
  if v_campaign_offer_id is null then
    raise exception 'no CampaignOffer with code %', p_code using errcode = 'P0002';
  end if;
  select l.media_object_id, m.object_key into v_previous_id, v_previous_key
  from public."CampaignOfferMedia" l
  join public."MediaObject" m on m.id = l.media_object_id
  where l.campaign_offer_id = v_campaign_offer_id and l.slot = p_slot
  for update of l;

  insert into public."MediaObject" (object_key, kind, content_type, byte_size)
  values (p_object_key, p_kind, p_content_type, p_byte_size)
  returning id into v_new_id;
  if v_previous_id is not null then
    delete from public."MediaObject" where id = v_previous_id;
  end if;
  insert into public."CampaignOfferMedia" (campaign_offer_id, media_object_id, slot)
  values (v_campaign_offer_id, v_new_id, p_slot);

  return v_previous_key;
end
$$;

create function public.remove_campaign_offer(p_campaign_offer_id uuid) returns setof text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_operator() then
    raise exception 'only an Operator can remove a CampaignOffer' using errcode = '42501';
  end if;
  perform 1 from public."CampaignOffer" o where o.id = p_campaign_offer_id for update;
  if not found then
    raise exception 'no such CampaignOffer' using errcode = 'P0002';
  end if;
  return query
    with gone as (
      delete from public."MediaObject" m
      using public."CampaignOfferMedia" l
      where l.media_object_id = m.id and l.campaign_offer_id = p_campaign_offer_id
      returning m.object_key
    )
    select gone.object_key from gone;
  delete from public."CampaignOffer" where id = p_campaign_offer_id;
end
$$;

create function public.set_campaign_published(p_published boolean) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_operator() then
    raise exception 'only an Operator can publish the campaign' using errcode = '42501';
  end if;
  if p_published and not exists (select 1 from public."CampaignOffer") then
    raise exception 'there is no CampaignOffer to publish' using errcode = '23514';
  end if;
  update public."Campaign" set
    is_published = p_published,
    published_at = case when p_published then now() else published_at end,
    published_by = case when p_published then (select auth.uid()) else published_by end
  where id = 1;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- The offer content check (DATA_MODEL.md §5). Run by the human in the SQL Editor; zero rows is PASS.
-- ---------------------------------------------------------------------------------------------

create function public.campaign_offer_drift()
returns table (code text, field text, published_value text, sheet_value text)
language sql
stable
security definer
set search_path = ''
as $$
  with matched as (
    select
      o.*,
      (select e from jsonb_array_elements(i.sheet_rows) e where upper(e ->> 'code') = o.code_key limit 1) as s
    from public."CampaignOffer" o
    join public."CampaignImport" i on i.id = o.last_import_id
  )
  select m.code, 'missing from its import', null::text, null::text
  from matched m
  where m.s is null
  union all
  select m.code, f.field, f.published_value, f.sheet_value
  from matched m
  cross join lateral (values
    ('code', m.code, m.s ->> 'code'),
    ('name_ar', m.name_ar, m.s ->> 'name_ar'),
    ('name_en', m.name_en, m.s ->> 'name_en'),
    ('price_egp', to_char(m.price_egp, 'FM9999999990.00'), m.s ->> 'price_egp'),
    ('starts_on', to_char(m.starts_on, 'YYYY-MM-DD'), m.s ->> 'starts_on'),
    ('ends_on', to_char(m.ends_on, 'YYYY-MM-DD'), m.s ->> 'ends_on'),
    ('conditions_ar', m.conditions_ar, m.s ->> 'conditions_ar'),
    ('conditions_en', m.conditions_en, m.s ->> 'conditions_en'),
    ('display_order', m.display_order::text, m.s ->> 'display_order'),
    ('sheet_row', m.sheet_row::text, m.s ->> 'sheet_row')
  ) as f (field, published_value, sheet_value)
  where m.s is not null and f.published_value is distinct from f.sheet_value
$$;

-- ---------------------------------------------------------------------------------------------
-- Row-level security: deny by default (SECURITY_MODEL.md §2)
-- ---------------------------------------------------------------------------------------------

alter table public."Operator" enable row level security;
alter table public."Campaign" enable row level security;
alter table public."CampaignImport" enable row level security;
alter table public."CampaignOffer" enable row level security;
alter table public."MediaObject" enable row level security;
alter table public."CampaignOfferMedia" enable row level security;

create policy campaign_read_published on public."Campaign"
  for select to anon, authenticated using (is_published);
create policy campaign_read_operator on public."Campaign"
  for select to authenticated using ((select public.is_operator()));
create policy campaign_update_operator on public."Campaign"
  for update to authenticated using ((select public.is_operator())) with check ((select public.is_operator()));

create policy campaign_offer_read_visible on public."CampaignOffer"
  for select to anon, authenticated using (public.campaign_offer_is_visible(starts_on, ends_on));
create policy campaign_offer_read_operator on public."CampaignOffer"
  for select to authenticated using ((select public.is_operator()));

create policy campaign_import_read_operator on public."CampaignImport"
  for select to authenticated using ((select public.is_operator()));

create policy campaign_offer_media_read_visible on public."CampaignOfferMedia"
  for select to anon, authenticated using (exists (
    select 1 from public."CampaignOffer" o
    where o.id = campaign_offer_id and public.campaign_offer_is_visible(o.starts_on, o.ends_on)));
create policy campaign_offer_media_read_operator on public."CampaignOfferMedia"
  for select to authenticated using ((select public.is_operator()));

create policy media_object_read_visible on public."MediaObject"
  for select to anon, authenticated using (exists (
    select 1
    from public."CampaignOfferMedia" l
    join public."CampaignOffer" o on o.id = l.campaign_offer_id
    where l.media_object_id = "MediaObject".id and public.campaign_offer_is_visible(o.starts_on, o.ends_on)));
create policy media_object_read_operator on public."MediaObject"
  for select to authenticated using ((select public.is_operator()));

-- ---------------------------------------------------------------------------------------------
-- Privileges: undo the platform's broad defaults, then grant only what the policies above serve
-- ---------------------------------------------------------------------------------------------

revoke all on table
  public."Operator", public."Campaign", public."CampaignImport",
  public."CampaignOffer", public."MediaObject", public."CampaignOfferMedia"
from public, anon, authenticated;

grant select (id, is_published, whatsapp_display, whatsapp_digits, hotline_display, hotline_dial, nel_site_url)
  on public."Campaign" to anon;
grant select on public."Campaign" to authenticated;
grant update (whatsapp_display, whatsapp_digits, hotline_display, hotline_dial, nel_site_url)
  on public."Campaign" to authenticated;

grant select (id, code, code_key, name_ar, name_en, price_egp, starts_on, ends_on, conditions_ar,
              conditions_en, display_order, sheet_row)
  on public."CampaignOffer" to anon;
grant select on public."CampaignOffer" to authenticated;

grant select on public."CampaignImport" to authenticated;

grant select (id, object_key, kind, content_type) on public."MediaObject" to anon;
grant select on public."MediaObject" to authenticated;

grant select on public."CampaignOfferMedia" to anon, authenticated;

revoke all on function
  public.campaign_offer_media_kind_check(),
  public.campaign_touch(),
  public.campaign_today(),
  public.campaign_offer_status(date, date),
  public.campaign_offer_is_visible(date, date),
  public.is_operator(),
  public.apply_campaign_import(text, jsonb, integer, timestamptz),
  public.attach_media_object(text, text, text, text, text, bigint),
  public.remove_campaign_offer(uuid),
  public.set_campaign_published(boolean),
  public.campaign_offer_drift()
from public, anon, authenticated;

grant execute on function
  public.campaign_today(),
  public.campaign_offer_status(date, date),
  public.campaign_offer_is_visible(date, date)
to anon, authenticated;

grant execute on function
  public.is_operator(),
  public.apply_campaign_import(text, jsonb, integer, timestamptz),
  public.attach_media_object(text, text, text, text, text, bigint),
  public.remove_campaign_offer(uuid),
  public.set_campaign_published(boolean)
to authenticated;
