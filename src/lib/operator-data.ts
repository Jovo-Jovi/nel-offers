import "server-only";
import type { NormalisedRow } from "@/lib/campaign-sheet";
import { compareCampaignOrder } from "@/lib/campaign-order";
import type { StoredCampaignOffer } from "@/lib/campaign-sheet-diff";
import type { ContactDraft } from "@/lib/campaign-contacts";
import type { OperatorGate } from "@/lib/operator-session";
import { twoDecimals } from "@/lib/sheet-format";

const campaignOfferColumns =
  "id, code, code_key, name_ar, name_en, starts_on, ends_on, conditions_ar, conditions_en, display_order, sheet_row, price_egp::text";

function textOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function priceText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  if (typeof value === "string") return twoDecimals(value);
  return null;
}

export function asStored(
  row: Record<string, unknown>,
): (StoredCampaignOffer & { id: string; sheet_row: number }) | null {
  const price = priceText(row.price_egp ?? row["price_egp::text"]);
  if (typeof row.id !== "string" || typeof row.code !== "string" || typeof row.code_key !== "string") return null;
  if (typeof row.name_ar !== "string" || typeof row.name_en !== "string" || !price) return null;
  if (typeof row.ends_on !== "string" || typeof row.sheet_row !== "number") return null;
  const order = row.display_order;
  return {
    id: row.id,
    code_key: row.code_key,
    code: row.code,
    name_ar: row.name_ar,
    name_en: row.name_en,
    price_egp: price,
    starts_on: textOrNull(row.starts_on),
    ends_on: row.ends_on,
    conditions_ar: textOrNull(row.conditions_ar),
    conditions_en: textOrNull(row.conditions_en),
    display_order: typeof order === "number" ? order : null,
    sheet_row: row.sheet_row,
  };
}

export async function readCampaign(gate: OperatorGate) {
  const { data, error } = await gate.supabase
    .from("Campaign")
    .select(
      "is_published, show_card_price, whatsapp_display, whatsapp_digits, hotline_display, hotline_dial, nel_site_url, banner_media_object_id",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function readBannerKey(gate: OperatorGate, bannerId: string | null) {
  if (!bannerId) return null;
  const { data, error } = await gate.supabase
    .from("MediaObject")
    .select("object_key")
    .eq("id", bannerId)
    .maybeSingle();
  if (error || !data || typeof data.object_key !== "string") return null;
  return data.object_key;
}

export async function readLedger(gate: OperatorGate) {
  const { data, error } = await gate.supabase.from("CampaignOffer").select("updated_at");
  if (error || !data) return null;
  let updatedAt: string | null = null;
  for (const row of data) {
    const stamp = row.updated_at;
    if (typeof stamp !== "string") continue;
    if (updatedAt === null || Date.parse(stamp) > Date.parse(updatedAt)) updatedAt = stamp;
  }
  return { count: data.length, updatedAt };
}

export async function readToday(gate: OperatorGate) {
  const { data, error } = await gate.supabase.rpc("campaign_today");
  return error || typeof data !== "string" ? null : data;
}

export async function readCampaignOfferRows(gate: OperatorGate) {
  const { data, error } = await gate.supabase.from("CampaignOffer").select(campaignOfferColumns);
  if (error || !data) return null;
  const rows = [];
  for (const row of data) {
    const stored = asStored(row as Record<string, unknown>);
    if (stored) rows.push(stored);
  }
  rows.sort(compareCampaignOrder);
  return rows;
}

export function toNormalised(row: StoredCampaignOffer, sheetRow: number): NormalisedRow {
  return {
    sheet_row: sheetRow,
    code: row.code,
    name_ar: row.name_ar,
    name_en: row.name_en,
    price_egp: row.price_egp,
    starts_on: row.starts_on,
    ends_on: row.ends_on,
    conditions_ar: row.conditions_ar,
    conditions_en: row.conditions_en,
    display_order: row.display_order,
  };
}

export async function readStatuses(gate: OperatorGate) {
  const { data, error } = await gate.supabase.rpc("campaign_offer_statuses");
  const counts = { visible: 0, scheduled: 0, ended: 0, hidden: 0 };
  const byId = new Map<string, string>();
  if (error || !Array.isArray(data)) return { counts, byId };
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const id = "campaign_offer_id" in row ? row.campaign_offer_id : "";
    const status = "status" in row ? row.status : "";
    if (typeof id !== "string" || typeof status !== "string") continue;
    byId.set(id, status);
    if (status === "visible" || status === "scheduled" || status === "ended" || status === "hidden") {
      counts[status] += 1;
    }
  }
  return { counts, byId };
}

export async function readLastImport(gate: OperatorGate) {
  const { data, error } = await gate.supabase
    .from("CampaignImport")
    .select("confirmed_at, added_count, updated_count, unchanged_count")
    .order("confirmed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  if (typeof data.confirmed_at !== "string") return null;
  return {
    confirmedAt: data.confirmed_at,
    added: typeof data.added_count === "number" ? data.added_count : 0,
    updated: typeof data.updated_count === "number" ? data.updated_count : 0,
    unchanged: typeof data.unchanged_count === "number" ? data.unchanged_count : 0,
  };
}

export async function readSlots(gate: OperatorGate) {
  const { data, error } = await gate.supabase.from("CampaignOfferMedia").select("campaign_offer_id, slot");
  if (error || !data) return [];
  return data.flatMap((row) => {
    if (typeof row.campaign_offer_id !== "string" || typeof row.slot !== "string") return [];
    return [{ campaignOfferId: row.campaign_offer_id, slot: row.slot }];
  });
}

export function contactDraft(row: {
  whatsapp_display: string | null;
  whatsapp_digits: string | null;
  hotline_display: string | null;
  hotline_dial: string | null;
  nel_site_url: string | null;
}): ContactDraft {
  return {
    whatsapp_display: row.whatsapp_display ?? "",
    whatsapp_digits: row.whatsapp_digits ?? "",
    hotline_display: row.hotline_display ?? "",
    hotline_dial: row.hotline_dial ?? "",
    nel_site_url: row.nel_site_url ?? "",
  };
}
