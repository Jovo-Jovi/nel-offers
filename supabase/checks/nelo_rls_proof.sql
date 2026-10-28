-- NELO — RLS and function proof. Reviewer-authored (SECURITY_MODEL.md §2, DATA_MODEL.md §§3–5).
-- Run by the human in the Supabase SQL Editor, after at least one "Operator" row exists.
-- It writes synthetic rows (codes SYN-9xx), checks what each role can see and do, and then
-- raises an exception so that everything it wrote is rolled back. The exception message is the
-- outcome: "RLS PROOF (rolled back): PASS n/n" — or the labels of the checks that failed.
do $proof$
declare
  v_op uuid;
  v_stranger uuid := gen_random_uuid();
  v_today date := public.campaign_today();
  v_import uuid;
  v_visible uuid;
  v_scheduled uuid;
  v_ended uuid;
  v_new_import uuid;
  v_expected_count integer;
  v_expected_at timestamptz;
  v_key text;
  v_n bigint;
  v_t text;
  v_pass integer := 0;
  v_total integer := 0;
  v_failed text := '';
  v_rows jsonb;
begin
  select o.id into v_op from public."Operator" o order by o.created_at limit 1;
  if v_op is null then
    raise exception 'RLS PROOF NOT RUN: create an Operator row first';
  end if;

  -- Synthetic campaign, as the table owner -------------------------------------------------------
  update public."Campaign" set
    whatsapp_display = 'SYN', whatsapp_digits = '200000000000', hotline_display = 'SYN',
    hotline_dial = '000', nel_site_url = 'https://example.invalid', is_published = true
  where id = 1;

  v_rows := jsonb_build_array(
    jsonb_build_object('sheet_row', 2, 'code', 'SYN-901', 'name_ar', 'تحليل تجريبي 901',
      'name_en', 'Synthetic analysis 901', 'price_egp', '100.00', 'starts_on', null,
      'ends_on', to_char(v_today + 10, 'YYYY-MM-DD'), 'conditions_ar', null, 'conditions_en', null,
      'display_order', 1),
    jsonb_build_object('sheet_row', 3, 'code', 'SYN-902', 'name_ar', 'تحليل تجريبي 902',
      'name_en', 'Synthetic analysis 902', 'price_egp', '200.00',
      'starts_on', to_char(v_today + 5, 'YYYY-MM-DD'), 'ends_on', to_char(v_today + 20, 'YYYY-MM-DD'),
      'conditions_ar', 'شرط تجريبي', 'conditions_en', 'Synthetic condition', 'display_order', 2),
    jsonb_build_object('sheet_row', 4, 'code', 'SYN-903', 'name_ar', 'تحليل تجريبي 903',
      'name_en', 'Synthetic analysis 903', 'price_egp', '300.00', 'starts_on', null,
      'ends_on', to_char(v_today - 1, 'YYYY-MM-DD'), 'conditions_ar', null, 'conditions_en', null,
      'display_order', null));

  insert into public."CampaignImport" (sheet_sha256, sheet_rows, row_count, added_count, updated_count,
    unchanged_count, confirmed_by)
  values (repeat('0', 64), v_rows, 3, 3, 0, 0, v_op)
  returning id into v_import;

  insert into public."CampaignOffer" (code, name_ar, name_en, price_egp, starts_on, ends_on, conditions_ar,
    conditions_en, display_order, sheet_row, last_import_id)
  select r.code, r.name_ar, r.name_en, r.price_egp, r.starts_on, r.ends_on, r.conditions_ar,
    r.conditions_en, r.display_order, r.sheet_row, v_import
  from jsonb_to_recordset(v_rows) as r(sheet_row integer, code text, name_ar text, name_en text,
    price_egp numeric(12, 2), starts_on date, ends_on date, conditions_ar text, conditions_en text,
    display_order integer);

  select id into v_visible from public."CampaignOffer" where code = 'SYN-901';
  select id into v_scheduled from public."CampaignOffer" where code = 'SYN-902';
  select id into v_ended from public."CampaignOffer" where code = 'SYN-903';

  insert into public."MediaObject" (object_key, kind, content_type, byte_size)
  values ('media/' || gen_random_uuid() || '.webp', 'image', 'image/webp', 1000),
         ('media/' || gen_random_uuid() || '.webp', 'image', 'image/webp', 1000);
  insert into public."CampaignOfferMedia" (campaign_offer_id, media_object_id, slot)
  select v_visible, m.id, 'main_image' from public."MediaObject" m
  where m.object_key like 'media/%' and not exists (select 1 from public."CampaignOfferMedia" l where l.media_object_id = m.id)
  order by m.created_at, m.object_key limit 1;
  insert into public."CampaignOfferMedia" (campaign_offer_id, media_object_id, slot)
  select v_ended, m.id, 'main_image' from public."MediaObject" m
  where not exists (select 1 from public."CampaignOfferMedia" l where l.media_object_id = m.id)
  limit 1;

  -- 1–4: status ---------------------------------------------------------------------------------
  v_total := v_total + 4;
  if public.campaign_offer_status(null, v_today + 10) = 'visible' then v_pass := v_pass + 1; else v_failed := v_failed || ' | 1 status visible'; end if;
  if public.campaign_offer_status(v_today + 5, v_today + 20) = 'scheduled' then v_pass := v_pass + 1; else v_failed := v_failed || ' | 2 status scheduled'; end if;
  if public.campaign_offer_status(null, v_today - 1) = 'ended' then v_pass := v_pass + 1; else v_failed := v_failed || ' | 3 status ended'; end if;
  if public.campaign_offer_status(null, v_today) = 'visible' then v_pass := v_pass + 1; else v_failed := v_failed || ' | 4 last day visible'; end if;

  -- 5: drift is zero on a faithful import --------------------------------------------------------
  v_total := v_total + 1;
  select count(*) into v_n from public.campaign_offer_drift() d where d.code like 'SYN-9%';
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 5 drift zero (' || v_n || ')'; end if;

  -- Visitor (anon), campaign published ------------------------------------------------------------
  perform set_config('request.jwt.claims', '', true);
  set local role anon;

  v_total := v_total + 4;
  select count(*) into v_n from public."CampaignOffer" where code like 'SYN-9%';
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 6 anon sees 1 visible (' || v_n || ')'; end if;
  select count(*) into v_n from public."CampaignOfferMedia" where campaign_offer_id in (v_visible, v_scheduled, v_ended);
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 7 anon sees 1 link (' || v_n || ')'; end if;
  select count(*) into v_n from public."MediaObject" m
    where exists (select 1 from public."CampaignOfferMedia" l where l.media_object_id = m.id and l.campaign_offer_id in (v_visible, v_ended));
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 8 anon sees 1 MediaObject (' || v_n || ')'; end if;
  select count(*) into v_n from public."Campaign" where whatsapp_digits is not null;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 9 anon reads published contacts'; end if;

  v_total := v_total + 1;
  begin
    select published_by::text into v_t from public."Campaign";
    v_failed := v_failed || ' | 10 anon read published_by';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    select count(*) into v_n from public."Operator";
    v_failed := v_failed || ' | 11 anon read Operator';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    select count(*) into v_n from public."CampaignImport";
    v_failed := v_failed || ' | 12 anon read CampaignImport';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    insert into public."CampaignOffer" (code, name_ar, name_en, price_egp, ends_on, sheet_row, last_import_id)
    values ('SYN-999', 'x', 'x', 1, v_today + 1, 2, v_import);
    v_failed := v_failed || ' | 13 anon insert CampaignOffer';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    update public."Campaign" set whatsapp_display = 'X' where id = 1;
    v_failed := v_failed || ' | 14 anon update Campaign';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    perform public.apply_campaign_import(repeat('0', 64), v_rows, 0, null);
    v_failed := v_failed || ' | 15 anon ran apply_campaign_import';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    perform count(*) from public.campaign_offer_drift();
    v_failed := v_failed || ' | 16 anon ran campaign_offer_drift';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;

  -- Authenticated, not an Operator (aal2) ---------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_stranger, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  v_total := v_total + 3;
  if not public.is_operator() then v_pass := v_pass + 1; else v_failed := v_failed || ' | 17 stranger is_operator'; end if;
  select count(*) into v_n from public."CampaignImport";
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 18 stranger reads imports'; end if;
  select count(*) into v_n from public."CampaignOffer" where code like 'SYN-9%';
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 19 stranger sees only visible (' || v_n || ')'; end if;

  -- Operator at aal1 ------------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  v_total := v_total + 3;
  if not public.is_operator() then v_pass := v_pass + 1; else v_failed := v_failed || ' | 20 aal1 is_operator'; end if;
  select count(*) into v_n from public."CampaignOffer" where code like 'SYN-9%';
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 21 aal1 sees only visible (' || v_n || ')'; end if;
  begin
    perform public.set_campaign_published(false);
    v_failed := v_failed || ' | 22 aal1 changed the publish switch';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;

  -- Operator at aal2 ------------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  v_total := v_total + 3;
  if public.is_operator() then v_pass := v_pass + 1; else v_failed := v_failed || ' | 23 aal2 is_operator'; end if;
  select count(*) into v_n from public."CampaignOffer" where code like 'SYN-9%';
  if v_n = 3 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 24 operator sees all (' || v_n || ')'; end if;
  select count(*) into v_n from public."CampaignImport" where id = v_import;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 25 operator reads imports'; end if;

  v_total := v_total + 1;
  update public."Campaign" set hotline_display = 'SYN2' where id = 1;
  get diagnostics v_n = row_count;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 26 operator updates contacts'; end if;
  v_total := v_total + 1;
  begin
    update public."Campaign" set is_published = false where id = 1;
    v_failed := v_failed || ' | 27 operator flipped is_published directly';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    update public."CampaignOffer" set name_en = 'edited' where id = v_visible;
    v_failed := v_failed || ' | 28 operator edited an offer field';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    update public."Campaign" set whatsapp_display = '' where id = 1;
    v_failed := v_failed || ' | 29 blank contact accepted';
  exception when check_violation then v_pass := v_pass + 1;
  end;

  -- Import: add one, update one, keep one; stale preview; duplicate code; malformed row -----------
  select count(*), max(o.updated_at) into v_expected_count, v_expected_at from public."CampaignOffer" o;
  v_rows := jsonb_build_array(
    jsonb_build_object('sheet_row', 2, 'code', 'syn-901', 'name_ar', 'تحليل تجريبي 901',
      'name_en', 'Synthetic analysis 901 renamed', 'price_egp', '100.00', 'starts_on', null,
      'ends_on', to_char(v_today + 10, 'YYYY-MM-DD'), 'conditions_ar', null, 'conditions_en', null,
      'display_order', 1),
    jsonb_build_object('sheet_row', 3, 'code', 'SYN-902', 'name_ar', 'تحليل تجريبي 902',
      'name_en', 'Synthetic analysis 902', 'price_egp', '200.00',
      'starts_on', to_char(v_today + 5, 'YYYY-MM-DD'), 'ends_on', to_char(v_today + 20, 'YYYY-MM-DD'),
      'conditions_ar', 'شرط تجريبي', 'conditions_en', 'Synthetic condition', 'display_order', 2),
    jsonb_build_object('sheet_row', 5, 'code', 'SYN-904', 'name_ar', 'تحليل تجريبي 904',
      'name_en', 'Synthetic analysis 904', 'price_egp', '1250.50', 'starts_on', null,
      'ends_on', to_char(v_today + 3, 'YYYY-MM-DD'), 'conditions_ar', null, 'conditions_en', null,
      'display_order', null));
  v_new_import := public.apply_campaign_import(repeat('a', 64), v_rows, v_expected_count, v_expected_at);

  v_total := v_total + 4;
  select count(*) into v_n from public."CampaignImport"
    where id = v_new_import and added_count = 1 and updated_count = 1 and unchanged_count = 1 and confirmed_by = v_op;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 30 import counts 1/1/1'; end if;
  select count(*) into v_n from public."CampaignOffer"
    where code = 'syn-901' and name_en = 'Synthetic analysis 901 renamed' and last_import_id = v_new_import;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 31 update by code ignoring case'; end if;
  select count(*) into v_n from public."CampaignOffer" where code = 'SYN-903' and last_import_id = v_import;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 32 import never deletes'; end if;
  select count(*) into v_n from public."CampaignOffer" where code = 'SYN-904' and price_egp = 1250.50;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 33 new code added'; end if;

  v_total := v_total + 1;
  begin
    perform public.apply_campaign_import(repeat('b', 64), v_rows, v_expected_count, v_expected_at);
    v_failed := v_failed || ' | 34 stale preview accepted';
  exception when serialization_failure then v_pass := v_pass + 1;
  end;
  select count(*), max(o.updated_at) into v_expected_count, v_expected_at from public."CampaignOffer" o;
  v_total := v_total + 1;
  begin
    perform public.apply_campaign_import(repeat('c', 64),
      v_rows || jsonb_build_array(jsonb_set(v_rows -> 0, '{sheet_row}', '9')), v_expected_count, v_expected_at);
    v_failed := v_failed || ' | 35 duplicate code accepted';
  exception when unique_violation then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    perform public.apply_campaign_import(repeat('d', 64),
      jsonb_build_array(jsonb_set(v_rows -> 0, '{price_egp}', '"100.005"')), v_expected_count, v_expected_at);
    v_failed := v_failed || ' | 36 malformed price accepted';
  exception when invalid_parameter_value then v_pass := v_pass + 1;
  end;
  v_total := v_total + 1;
  begin
    perform public.apply_campaign_import(repeat('e', 64),
      jsonb_build_array(jsonb_set(v_rows -> 0, '{conditions_ar}', '"شرط"')), v_expected_count, v_expected_at);
    v_failed := v_failed || ' | 37 unpaired conditions accepted';
  exception when check_violation then v_pass := v_pass + 1;
  end;

  -- MediaObject link and replacement; wrong kind; oversize ----------------------------------------
  v_total := v_total + 4;
  v_key := public.attach_media_object('syn-904', 'main_video', 'media/' || gen_random_uuid() || '.mp4', 'video', 'video/mp4', 5000);
  if v_key is null then v_pass := v_pass + 1; else v_failed := v_failed || ' | 38 first attach replaces nothing'; end if;
  v_t := 'media/' || gen_random_uuid() || '.mp4';
  v_key := public.attach_media_object('SYN-904', 'main_video', v_t, 'video', 'video/mp4', 6000);
  if v_key is not null and v_key <> v_t then v_pass := v_pass + 1; else v_failed := v_failed || ' | 39 second attach returns the replaced key'; end if;
  begin
    perform public.attach_media_object('SYN-904', 'gallery_1', 'media/' || gen_random_uuid() || '.mp4', 'video', 'video/mp4', 5000);
    v_failed := v_failed || ' | 40 video accepted in a gallery slot';
  exception when check_violation then v_pass := v_pass + 1;
  end;
  begin
    perform public.attach_media_object('SYN-904', 'gallery_1', 'media/' || gen_random_uuid() || '.webp', 'image', 'image/webp', 20000000);
    v_failed := v_failed || ' | 41 oversize image accepted';
  exception when check_violation then v_pass := v_pass + 1;
  end;

  -- Removal returns the object keys to delete from R2 --------------------------------------------
  v_total := v_total + 2;
  select count(*) into v_n from public.remove_campaign_offer((select o.id from public."CampaignOffer" o where o.code = 'SYN-904'));
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 42 removal returns 1 key (' || v_n || ')'; end if;
  select count(*) into v_n from public."CampaignOffer" where code = 'SYN-904';
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 43 removal deletes the CampaignOffer'; end if;

  -- Publish switch --------------------------------------------------------------------------------
  perform public.set_campaign_published(false);
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  v_total := v_total + 2;
  select count(*) into v_n from public."CampaignOffer" where code like 'SYN-9%';
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 44 unpublished hides every offer (' || v_n || ')'; end if;
  select count(*) into v_n from public."Campaign";
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 45 unpublished hides the contacts'; end if;

  -- The drift check: zero after a real import, and it sees a field changed outside the import ----
  reset role;
  perform set_config('request.jwt.claims', '', true);
  v_total := v_total + 2;
  select count(*) into v_n from public.campaign_offer_drift() d where d.code ilike 'SYN-9%';
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 46 drift zero after import (' || v_n || ')'; end if;
  update public."CampaignOffer" set name_ar = 'تحليل تجريبي 902 معدل' where code = 'SYN-902';
  select count(*) into v_n from public.campaign_offer_drift() d where d.code = 'SYN-902' and d.field = 'name_ar';
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 47 drift sees an outside edit'; end if;

  if v_pass = v_total then
    raise exception 'RLS PROOF (rolled back): PASS %/%', v_pass, v_total;
  end if;
  raise exception 'RLS PROOF (rolled back): FAIL %/% —%', v_pass, v_total, v_failed;
end
$proof$;
