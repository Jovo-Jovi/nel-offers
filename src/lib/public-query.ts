import type { SupabaseClient } from "@supabase/supabase-js";
import { compareCampaignOrder } from "./campaign-order";
import { twoDecimals } from "./sheet-format";

const campaignOfferColumns =
  "id, code, code_key, name_ar, name_en, price_egp::text, ends_on, conditions_ar, conditions_en, display_order, sheet_row";

const attachmentSlots = ["main_video", "main_image", "gallery_1", "gallery_2", "gallery_3"] as const;

export type PublicCampaign = {
  isPublished: boolean;
  showCardPrice: boolean;
  whatsappDisplay: string;
  whatsappDigits: string;
  hotlineDisplay: string;
  hotlineDial: string;
  nelSiteUrl: string;
  bannerId: string | null;
};

export type PublicCampaignOffer = {
  id: string;
  code: string;
  codeKey: string;
  nameAr: string;
  nameEn: string;
  priceText: string;
  endsOn: string;
  conditionsAr: string | null;
  conditionsEn: string | null;
  displayOrder: number | null;
  sheetRow: number;
};

export type PublicAttachment = {
  slot: (typeof attachmentSlots)[number];
  kind: string;
  objectKey: string;
};

function halt(): never {
  throw new Error("public-read-failed");
}

function textOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asPrice(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  if (typeof value === "string") return twoDecimals(value);
  return null;
}

function asCampaignOffer(row: Record<string, unknown>): PublicCampaignOffer | null {
  const price = asPrice(row.price_egp ?? row["price_egp::text"]);
  if (typeof row.id !== "string" || typeof row.code !== "string" || typeof row.code_key !== "string") return null;
  if (typeof row.name_ar !== "string" || typeof row.name_en !== "string" || !price) return null;
  if (typeof row.ends_on !== "string" || typeof row.sheet_row !== "number") return null;
  const order = row.display_order;
  return {
    id: row.id,
    code: row.code,
    codeKey: row.code_key,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    priceText: price,
    endsOn: row.ends_on,
    conditionsAr: textOrNull(row.conditions_ar),
    conditionsEn: textOrNull(row.conditions_en),
    displayOrder: typeof order === "number" ? order : null,
    sheetRow: row.sheet_row,
  };
}

function isSlot(value: string): value is PublicAttachment["slot"] {
  return (attachmentSlots as readonly string[]).includes(value);
}

export async function readCampaignRow(supabase: SupabaseClient): Promise<PublicCampaign | null> {
  const { data, error } = await supabase
    .from("Campaign")
    .select(
      "is_published, show_card_price, whatsapp_display, whatsapp_digits, hotline_display, hotline_dial, nel_site_url, banner_media_object_id",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) halt();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  if (typeof row.is_published !== "boolean" || typeof row.show_card_price !== "boolean") halt();
  if (typeof row.whatsapp_display !== "string" || typeof row.whatsapp_digits !== "string") halt();
  if (typeof row.hotline_display !== "string" || typeof row.hotline_dial !== "string") halt();
  if (typeof row.nel_site_url !== "string") halt();
  const bannerId = row.banner_media_object_id;
  if (bannerId !== null && typeof bannerId !== "string") halt();
  return {
    isPublished: row.is_published,
    showCardPrice: row.show_card_price,
    whatsappDisplay: row.whatsapp_display,
    whatsappDigits: row.whatsapp_digits,
    hotlineDisplay: row.hotline_display,
    hotlineDial: row.hotline_dial,
    nelSiteUrl: row.nel_site_url,
    bannerId,
  };
}

export async function readBannerKey(supabase: SupabaseClient, bannerId: string) {
  const { data, error } = await supabase.from("MediaObject").select("object_key").eq("id", bannerId).maybeSingle();
  if (error) halt();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  if (typeof row.object_key !== "string") halt();
  return row.object_key;
}

export async function readVisibleCampaignOffers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("CampaignOffer")
    .select(campaignOfferColumns)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("sheet_row", { ascending: true })
    .order("code_key", { ascending: true });
  if (error || !data) halt();
  const rows: PublicCampaignOffer[] = [];
  for (const entry of data) {
    const parsed = asCampaignOffer(entry as Record<string, unknown>);
    if (!parsed) halt();
    rows.push(parsed);
  }
  rows.sort((earlier, later) =>
    compareCampaignOrder(
      { display_order: earlier.displayOrder, sheet_row: earlier.sheetRow, code_key: earlier.codeKey },
      { display_order: later.displayOrder, sheet_row: later.sheetRow, code_key: later.codeKey },
    ),
  );
  return rows;
}

export async function readVisibleCampaignOffer(supabase: SupabaseClient, code: string) {
  const { data, error } = await supabase
    .from("CampaignOffer")
    .select(campaignOfferColumns)
    .eq("code_key", code.toUpperCase())
    .maybeSingle();
  if (error) halt();
  if (!data) return null;
  const parsed = asCampaignOffer(data as Record<string, unknown>);
  if (!parsed) halt();
  return parsed;
}

export async function readCampaignOfferAttachments(supabase: SupabaseClient, campaignOfferId: string) {
  const { data, error } = await supabase
    .from("CampaignOfferMedia")
    .select("slot, media_object_id")
    .eq("campaign_offer_id", campaignOfferId);
  if (error || !data) halt();
  const links: { slot: PublicAttachment["slot"]; objectId: string }[] = [];
  for (const entry of data) {
    const row = entry as Record<string, unknown>;
    if (typeof row.slot !== "string" || typeof row.media_object_id !== "string" || !isSlot(row.slot)) halt();
    links.push({ slot: row.slot, objectId: row.media_object_id });
  }
  if (links.length === 0) return [];
  const { data: stored, error: storedError } = await supabase
    .from("MediaObject")
    .select("id, object_key, kind")
    .in(
      "id",
      links.map((link) => link.objectId),
    );
  if (storedError || !stored) halt();
  const byId = new Map<string, { objectKey: string; kind: string }>();
  for (const entry of stored) {
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.object_key !== "string" || typeof row.kind !== "string") halt();
    byId.set(row.id, { objectKey: row.object_key, kind: row.kind });
  }
  const attachments: PublicAttachment[] = [];
  for (const slot of attachmentSlots) {
    const link = links.find((row) => row.slot === slot);
    if (!link) continue;
    const storedObject = byId.get(link.objectId);
    if (!storedObject) halt();
    attachments.push({ slot, kind: storedObject.kind, objectKey: storedObject.objectKey });
  }
  return attachments;
}
