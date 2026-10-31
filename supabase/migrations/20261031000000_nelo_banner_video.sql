-- NELO — the campaign banner may be a video (OD-08).
-- Reviewer-authored (DECISIONS.md OD-08, DATA_MODEL.md §2.1). Landed byte-exact by T09 and applied once with
-- `node --env-file=.env.local scripts/sql/run.mjs supabase/migrations/20261031000000_nelo_banner_video.sql --apply`.
-- It replaces two functions in place. No table, column, row, policy or grant changes; ownership and
-- grants of a replaced function stay as they are; the current banner stays as it is.

create or replace function public.campaign_banner_kind_check() returns trigger
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
  if v_kind is null or v_kind not in ('image', 'video') then
    raise exception 'the campaign banner must be an image or a video' using errcode = '23514';
  end if;
  return new;
end
$$;

create or replace function public.attach_campaign_banner(
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

  -- The kind follows the content type; the MediaObject limits check refuses any other pairing.
  insert into public."MediaObject" (object_key, kind, content_type, byte_size)
  values (
    p_object_key,
    case when p_content_type = 'video/mp4' then 'video' else 'image' end,
    p_content_type,
    p_byte_size)
  returning id into v_new_id;
  update public."Campaign" set banner_media_object_id = v_new_id where id = 1;
  if v_previous_id is not null then
    delete from public."MediaObject" where id = v_previous_id;
  end if;

  return v_previous_key;
end
$$;
