-- NELO — proof for the Operator controls: the show/hide switch and removing one slot (OD-04 items 2–3).
-- Reviewer-authored. Run after 20261029040000_nelo_operator_controls.sql, with at least one "Operator"
-- row. It ends by raising an exception so that everything it wrote is rolled back. The message is
-- the outcome: "OPERATOR CONTROLS PROOF (rolled back): PASS n/n".
do $proof$
declare
  v_op uuid;
  v_today date := public.campaign_today();
  v_rows jsonb;
  v_count bigint;
  v_at timestamptz;
  v_id uuid;
  v_key text;
  v_main text := 'media/' || gen_random_uuid() || '.webp';
  v_gallery text := 'media/' || gen_random_uuid() || '.webp';
  v_n bigint;
  v_t text;
  v_pass integer := 0;
  v_total integer := 0;
  v_failed text := '';
begin
  select o.id into v_op from public."Operator" o order by o.created_at limit 1;
  if v_op is null then
    raise exception 'OPERATOR CONTROLS PROOF NOT RUN: create an Operator row first';
  end if;

  update public."Campaign" set
    whatsapp_display = 'SYN', whatsapp_digits = '200000000000', hotline_display = 'SYN',
    hotline_dial = '000', nel_site_url = 'https://example.invalid', is_published = true
  where id = 1;

  -- Operator at aal2: one visible CampaignOffer with two MediaObjects -----------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  select count(*), max(o.updated_at) into v_count, v_at from public."CampaignOffer" o;
  v_rows := jsonb_build_array(jsonb_build_object(
    'sheet_row', 2, 'code', 'SYN-951', 'name_ar', 'تحليل تجريبي 951', 'name_en', 'Synthetic analysis 951',
    'price_egp', '100.00', 'starts_on', null, 'ends_on', to_char(v_today + 5, 'YYYY-MM-DD'),
    'conditions_ar', null, 'conditions_en', null, 'display_order', null));
  perform public.apply_campaign_import(repeat('d', 64), v_rows, v_count::integer, v_at);
  select o.id into v_id from public."CampaignOffer" o where o.code = 'SYN-951';
  perform public.attach_media_object('SYN-951', 'main_image', v_main, 'image', 'image/webp', 2000);
  perform public.attach_media_object('SYN-951', 'gallery_1', v_gallery, 'image', 'image/webp', 2000);

  v_total := v_total + 2;
  perform public.set_campaign_offer_shown(v_id, false);
  select s.status into v_t from public.campaign_offer_statuses() s where s.campaign_offer_id = v_id;
  if v_t = 'off' then v_pass := v_pass + 1; else v_failed := v_failed || ' | 1 status off (' || coalesce(v_t, 'null') || ')'; end if;
  begin
    update public."CampaignOffer" set is_shown = true where id = v_id;
    v_failed := v_failed || ' | 2 operator set is_shown directly';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;

  -- Visitor while it is off -----------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  v_total := v_total + 5;
  select count(*) into v_n from public."CampaignOffer" o where o.code = 'SYN-951';
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 3 anon reads a switched-off offer'; end if;
  select count(*) into v_n from public."CampaignOfferMedia" l where l.campaign_offer_id = v_id;
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 4 anon reads its links'; end if;
  select count(*) into v_n from public."MediaObject" m where m.object_key in (v_main, v_gallery);
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 5 anon reads its MediaObjects'; end if;
  begin
    perform public.set_campaign_offer_shown(v_id, true);
    v_failed := v_failed || ' | 6 anon ran set_campaign_offer_shown';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  begin
    perform public.remove_campaign_offer_media(v_id, 'gallery_1');
    v_failed := v_failed || ' | 7 anon ran remove_campaign_offer_media';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;

  -- Operator at aal1 ------------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  v_total := v_total + 2;
  begin
    perform public.set_campaign_offer_shown(v_id, true);
    v_failed := v_failed || ' | 8 aal1 switched an offer';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  begin
    perform public.remove_campaign_offer_media(v_id, 'gallery_1');
    v_failed := v_failed || ' | 9 aal1 removed a slot';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;

  -- Operator at aal2: the import keeps the switch; the drift check ignores it; on again ----------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  v_total := v_total + 2;
  select count(*), max(o.updated_at) into v_count, v_at from public."CampaignOffer" o;
  perform public.apply_campaign_import(repeat('e', 64), v_rows, v_count::integer, v_at);
  select count(*) into v_n from public."CampaignOffer" o where o.code = 'SYN-951' and not o.is_shown;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 10 a re-import switched it back on'; end if;
  reset role;
  select count(*) into v_n from public.campaign_offer_drift() d where d.code = 'SYN-951';
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 11 drift counts the switch'; end if;
  set local role authenticated;
  perform public.set_campaign_offer_shown(v_id, true);

  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  v_total := v_total + 2;
  select count(*) into v_n from public."CampaignOffer" o where o.code = 'SYN-951';
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 12 switched on, anon cannot read it'; end if;
  select count(*) into v_n from public."MediaObject" m where m.object_key in (v_main, v_gallery);
  if v_n = 2 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 13 switched on, anon cannot read its MediaObjects (' || v_n || ')'; end if;

  -- Removing one slot ------------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  v_total := v_total + 3;
  v_key := public.remove_campaign_offer_media(v_id, 'gallery_1');
  if v_key = v_gallery then v_pass := v_pass + 1; else v_failed := v_failed || ' | 14 removal returns the key'; end if;
  select count(*) into v_n from public."MediaObject" m where m.object_key = v_gallery;
  select v_n + count(*) into v_n from public."CampaignOfferMedia" l where l.campaign_offer_id = v_id and l.slot = 'gallery_1';
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 15 removal leaves a row'; end if;
  v_key := public.remove_campaign_offer_media(v_id, 'gallery_1');
  if v_key is null then v_pass := v_pass + 1; else v_failed := v_failed || ' | 16 an empty slot returns a key'; end if;

  reset role;
  if v_pass = v_total then
    raise exception 'OPERATOR CONTROLS PROOF (rolled back): PASS %/%', v_pass, v_total;
  end if;
  raise exception 'OPERATOR CONTROLS PROOF (rolled back): FAIL %/% —%', v_pass, v_total, v_failed;
end
$proof$;
