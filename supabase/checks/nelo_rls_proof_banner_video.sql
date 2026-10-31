-- NELO — proof for the campaign banner as an image or a video (OD-08).
-- Reviewer-authored. Run after 20261031000000_nelo_banner_video.sql with
-- `node --env-file=.env.local scripts/sql/run.mjs supabase/checks/nelo_rls_proof_banner_video.sql`
-- or in the Supabase SQL Editor, with at least one "Operator" row.
-- It ends by raising an exception, so everything it wrote is rolled back: the live banner, the publish
-- flag and every MediaObject row are as they were. It touches no object in R2.
-- The message is the outcome: "BANNER VIDEO PROOF (rolled back): PASS n/n".
do $proof$
declare
  v_op uuid;
  v_image_key text;
  v_video_key text;
  v_key text;
  v_kind text;
  v_banner uuid;
  v_n bigint;
  v_pass integer := 0;
  v_total integer := 0;
  v_failed text := '';
begin
  select o.id into v_op from public."Operator" o order by o.created_at limit 1;
  if v_op is null then
    raise exception 'BANNER VIDEO PROOF NOT RUN: create an Operator row first';
  end if;
  update public."Campaign" set is_published = true where id = 1;

  -- Operator at aal2 ------------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  set local role authenticated;

  v_total := v_total + 6;
  v_image_key := 'media/' || gen_random_uuid() || '.webp';
  perform public.attach_campaign_banner(v_image_key, 'image/webp', 2000);
  select m.kind into v_kind from public."Campaign" c join public."MediaObject" m on m.id = c.banner_media_object_id where c.id = 1;
  if v_kind = 'image' then v_pass := v_pass + 1; else v_failed := v_failed || ' | 1 an image banner is an image'; end if;
  v_video_key := 'media/' || gen_random_uuid() || '.mp4';
  v_key := public.attach_campaign_banner(v_video_key, 'video/mp4', 5000000);
  if v_key = v_image_key then v_pass := v_pass + 1; else v_failed := v_failed || ' | 2 a video banner replaces the image and returns its key'; end if;
  select m.kind into v_kind from public."Campaign" c join public."MediaObject" m on m.id = c.banner_media_object_id where c.id = 1;
  if v_kind = 'video' then v_pass := v_pass + 1; else v_failed := v_failed || ' | 3 a video banner is a video'; end if;
  select count(*) into v_n from public."MediaObject" where object_key = v_image_key;
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 4 the replaced image row is deleted'; end if;
  v_key := public.attach_campaign_banner('media/' || gen_random_uuid() || '.webp', 'image/webp', 3000);
  if v_key = v_video_key then v_pass := v_pass + 1; else v_failed := v_failed || ' | 5 an image banner replaces the video and returns its key'; end if;
  select count(*) into v_n from public."MediaObject" where object_key = v_video_key;
  if v_n = 0 then v_pass := v_pass + 1; else v_failed := v_failed || ' | 6 the replaced video row is deleted'; end if;

  v_total := v_total + 4;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.mp4', 'image/webp', 2000);
    v_failed := v_failed || ' | 7 an .mp4 key with an image type accepted';
  exception when check_violation then v_pass := v_pass + 1;
  end;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.webp', 'video/mp4', 2000);
    v_failed := v_failed || ' | 8 a .webp key with a video type accepted';
  exception when check_violation then v_pass := v_pass + 1;
  end;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.mp4', 'video/mp4', 104857601);
    v_failed := v_failed || ' | 9 a video over 100 MB accepted';
  exception when check_violation then v_pass := v_pass + 1;
  end;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.mov', 'video/quicktime', 2000);
    v_failed := v_failed || ' | 10 another video type accepted';
  exception when check_violation then v_pass := v_pass + 1;
  end;

  v_video_key := 'media/' || gen_random_uuid() || '.mp4';
  perform public.attach_campaign_banner(v_video_key, 'video/mp4', 5000000);
  select c.banner_media_object_id into v_banner from public."Campaign" c where c.id = 1;

  -- Visitor, published: reads the video banner, cannot set one -------------------------------------
  reset role;
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  v_total := v_total + 2;
  select m.kind into v_kind from public."MediaObject" m where m.id = v_banner;
  if v_kind = 'video' then v_pass := v_pass + 1; else v_failed := v_failed || ' | 11 anon reads the video banner and its kind'; end if;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.mp4', 'video/mp4', 2000);
    v_failed := v_failed || ' | 12 anon set the banner';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;

  -- Operator at aal1 ------------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_op, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  v_total := v_total + 1;
  begin
    perform public.attach_campaign_banner('media/' || gen_random_uuid() || '.mp4', 'video/mp4', 2000);
    v_failed := v_failed || ' | 13 aal1 set the banner';
  exception when insufficient_privilege then v_pass := v_pass + 1;
  end;

  reset role;
  if v_pass = v_total then
    raise exception 'BANNER VIDEO PROOF (rolled back): PASS %/%', v_pass, v_total;
  end if;
  raise exception 'BANNER VIDEO PROOF (rolled back): FAIL %/% —%', v_pass, v_total, v_failed;
end
$proof$;
