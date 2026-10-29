-- NELO — proof for the card-price switch, the campaign banner and the dashboard statuses.
-- Reviewer-authored (DECISIONS.md OD-02 items 5–6). Run by the human in the Supabase SQL Editor after
-- 20261029010000_nelo_campaign_presentation.sql, with at least one "Operator" row.
-- Like nelo_rls_proof.sql, it ends by raising an exception so that everything it wrote is rolled
-- back. The message is the outcome: "PRESENTATION PROOF (rolled back): PASS n/n".
do $proof$
declare
  v_op uuid;
  v_banner uuid;
  v_key text;
  v_first text;
  v_n bigint;
  v_count bigint;
  v_b boolean;
  v_pass integer := 0;
  v_total integer := 0;
  v_failed text := '';
begin
  select o.id into v_op from public."Operator" o order by o.created_at limit 1;
  if v_op is null then
    raise exception 'PRESENTATION PROOF NOT RUN: create an Operator row first';
  end if;

  update public."Campaign" set
    whatsapp_display = 'SYN', whatsapp_digits = '200000000000', hotline_display = 'SYN',
    hotline_dial = '000', nel_site_url = 'https://example.invalid', is_published = true,
    show_card_price = true, banner_media_object_id = null
  where id = 1;

  -- Operator at aal2: banner, replacement, switch ------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;

  v_total := v_total + 4;
  v_first := 'media/' || gen_random_uuid() || '.webp';
  v_key := public.attach_campaign_banner(v_first, 'image/webp', 2000);
  if v_key is null then v_pass := v_pass + 1; else v_failed := v_failed || ' | 1 first banner replaces nothing'; end if;
  v_key := public.attach_campaign_banner('media/' || gen_random_uuid() || '.webp', 'image/webp', 3000);
  if v_key = v_first then v_pass := v_pass + 1; else v_failed := v_failed || ' | 2 second banner returns the first key'; end if;
  select count(*) into v_n from public."MediaObject" where object_key = v_first;
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 3 replaced banner row deleted'; end if;
  update public."Campaign" set show_card_price = false where id = 1;
  get diagnostics v_n = row_count;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 4 operator turns the card price off'; end if;
  select c.banner_media_object_id into v_banner from public."Campaign" c where c.id = 1;

  v_total := v_total + 2;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.mp4', 'video/mp4', 2000);
    v_failed := v_failed || ' | 5 video accepted as banner';
  exception when check_violation then v_pass := v_pass + 1;
  end;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.webp', 'image/webp', 20000000);
    v_failed := v_failed || ' | 6 oversize banner accepted';
  exception when check_violation then v_pass := v_pass + 1;
  end;

  -- Visitor, published --------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  v_total := v_total + 3;
  select c.show_card_price into v_b from public."Campaign" c where c.id = 1;
  if v_b = false then v_pass := v_pass + 1; else v_failed := v_failed || ' | 7 anon reads the card-price switch'; end if;
  select count(*) into v_n from public."MediaObject" m where m.id = v_banner;
  if v_n = 1 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 8 anon reads the banner MediaObject'; end if;
  begin
    update public."Campaign" set show_card_price = true where id = 1;
    v_failed := v_failed || ' | 9 anon changed the card-price switch';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;

  -- Operator at aal1 ----------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  v_total := v_total + 2;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.webp', 'image/webp', 2000);
    v_failed := v_failed || ' | 10 aal1 set the banner';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  update public."Campaign" set show_card_price = true where id = 1;
  get diagnostics v_n = row_count;
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 11 aal1 changed the card-price switch'; end if;

  -- Visitor, unpublished: the banner is hidden --------------------------------------------------
  reset role;
  update public."Campaign" set is_published = false where id = 1;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  v_total := v_total + 1;
  select count(*) into v_n from public."MediaObject" m where m.id = v_banner;
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 12 unpublished hides the banner'; end if;

  -- Dashboard statuses: Operators only --------------------------------------------------------------
  reset role;
  v_total := v_total + 3;
  set local role anon;
  begin
    perform count(*) from public.campaign_offer_statuses();
    v_failed := v_failed || ' | 15 anon read the statuses';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.campaign_offer_statuses();
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 16 aal1 read the statuses'; end if;
  reset role;
  select count(*) into v_count from public."CampaignOffer";
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.campaign_offer_statuses();
  if v_n = v_count then v_pass := v_pass + 1; else v_failed := v_failed || ' | 17 operator reads one status per CampaignOffer'; end if;

  -- Removal returns the key to delete from R2 ----------------------------------------------------
  v_total := v_total + 2;
  v_key := public.remove_campaign_banner();
  if v_key is not null then v_pass := v_pass + 1; else v_failed := v_failed || ' | 13 removal returns the key'; end if;
  v_key := public.remove_campaign_banner();
  if v_key is null then v_pass := v_pass + 1; else v_failed := v_failed || ' | 14 removal with no banner returns null'; end if;

  reset role;
  if v_pass = v_total then
    raise exception 'PRESENTATION PROOF (rolled back): PASS %/%', v_pass, v_total;
  end if;
  raise exception 'PRESENTATION PROOF (rolled back): FAIL %/% —%', v_pass, v_total, v_failed;
end
$proof$;
