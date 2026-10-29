-- NELO — the stale-preview refusal of the import answers HTTP 409 once, instead of SQLSTATE 40001.
-- Reviewer-authored (DATA_MODEL.md §4.4; PRECEDENTS row on class-40 SQLSTATEs, landed by T03-F). Landed
-- byte-exact by T03-F. Applied once by the human in the Supabase SQL Editor, after
-- 20261029010000_nelo_campaign_presentation.sql.
-- PostgREST treats SQLSTATE 40001 as a transient serialization failure and retries the transaction
-- without end. SQLSTATE PT409 makes it answer HTTP 409. The body is unchanged from
-- 20261029000000_nelo_initial.sql apart from that one error code; privileges are kept by
-- `create or replace`.

create or replace function public.apply_campaign_import(
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
    raise exception 'the campaign changed since this preview — preview again' using errcode = 'PT409';
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
