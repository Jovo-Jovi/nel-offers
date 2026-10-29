"use server";

import { redirect } from "next/navigation";
import { operatorPath, type Locale } from "@/i18n/config";
import { createOperatorClient } from "@/lib/supabase/server";
import { contactProblems, type ContactDraft } from "@/lib/campaign-contacts";
import { revalidateOperator } from "@/lib/require-operator";
import { readOperatorGate } from "@/lib/operator-session";
import { uploadSlots } from "@/lib/media-object-name";
import { deleteObject } from "@/lib/r2";

async function gateOrDeny() {
  const gate = await readOperatorGate();
  if (gate.status !== "ok") return { gate: null, code: "forbidden" as const };
  return { gate, code: null };
}

export async function signOut(locale: Locale) {
  const supabase = await createOperatorClient();
  await supabase.auth.signOut();
  redirect(operatorPath(locale, "sign-in"));
}

export async function setPublished(locale: Locale, published: boolean) {
  const opened = await gateOrDeny();
  if (!opened.gate) return { ok: false as const, code: opened.code };
  const { error } = await opened.gate.supabase.rpc("set_campaign_published", { p_published: published });
  if (error) return { ok: false as const, code: "rejected" as const };
  revalidateOperator("overview");
  return { ok: true as const, locale };
}

export async function setCampaignOfferShown(locale: Locale, campaignOfferId: string, shown: boolean) {
  const opened = await gateOrDeny();
  if (!opened.gate) return { ok: false as const, code: opened.code };
  if (!/^[0-9a-f-]{36}$/i.test(campaignOfferId) || typeof shown !== "boolean") {
    return { ok: false as const, code: "rejected" as const };
  }
  const { error } = await opened.gate.supabase.rpc("set_campaign_offer_shown", {
    p_campaign_offer_id: campaignOfferId,
    p_shown: shown,
  });
  if (error) return { ok: false as const, code: "rejected" as const };
  revalidateOperator("campaign-offers");
  revalidateOperator("overview");
  revalidateOperator("media-objects");
  return { ok: true as const, locale };
}

export async function removeCampaignOfferMedia(locale: Locale, campaignOfferId: string, slot: string) {
  const opened = await gateOrDeny();
  if (!opened.gate) return { ok: false as const, code: opened.code };
  if (!/^[0-9a-f-]{36}$/i.test(campaignOfferId) || !uploadSlots.includes(slot as (typeof uploadSlots)[number])) {
    return { ok: false as const, code: "rejected" as const };
  }
  const { data, error } = await opened.gate.supabase.rpc("remove_campaign_offer_media", {
    p_campaign_offer_id: campaignOfferId,
    p_slot: slot,
  });
  if (error) return { ok: false as const, code: "rejected" as const };
  if (typeof data !== "string" || data.length === 0) {
    revalidateOperator("campaign-offers");
    revalidateOperator("media-objects");
    revalidateOperator("overview");
    return { ok: true as const, empty: true, locale };
  }
  let storageFailed = false;
  try {
    await deleteObject(data);
  } catch {
    storageFailed = true;
  }
  revalidateOperator("campaign-offers");
  revalidateOperator("media-objects");
  revalidateOperator("overview");
  return { ok: true as const, storageFailed, locale };
}

export async function removeCampaignOffer(locale: Locale, campaignOfferId: string) {
  const opened = await gateOrDeny();
  if (!opened.gate) return { ok: false as const, code: opened.code };
  if (!/^[0-9a-f-]{36}$/i.test(campaignOfferId)) return { ok: false as const, code: "rejected" as const };
  const { data, error } = await opened.gate.supabase.rpc("remove_campaign_offer", {
    p_campaign_offer_id: campaignOfferId,
  });
  if (error) return { ok: false as const, code: "rejected" as const };
  const keys = Array.isArray(data) ? data : [];
  let storageFailed = false;
  for (const key of keys) {
    if (typeof key !== "string") continue;
    try {
      await deleteObject(key);
    } catch {
      storageFailed = true;
    }
  }
  revalidateOperator("campaign-offers");
  revalidateOperator("overview");
  revalidateOperator("media-objects");
  return { ok: true as const, storageFailed, locale };
}

export async function saveContacts(locale: Locale, draft: ContactDraft) {
  const opened = await gateOrDeny();
  if (!opened.gate) return { ok: false as const, code: opened.code };
  const problems = contactProblems(draft);
  if (Object.keys(problems).length > 0) return { ok: false as const, problems };
  const { error } = await opened.gate.supabase
    .from("Campaign")
    .update({
      whatsapp_display: draft.whatsapp_display.trim(),
      whatsapp_digits: draft.whatsapp_digits.trim(),
      hotline_display: draft.hotline_display.trim(),
      hotline_dial: draft.hotline_dial.trim(),
      nel_site_url: draft.nel_site_url.trim(),
    })
    .eq("id", 1);
  if (error) return { ok: false as const, code: "rejected" as const };
  revalidateOperator("campaign-settings");
  revalidateOperator("overview");
  return { ok: true as const, locale };
}

export async function setCardPrice(locale: Locale, showCardPrice: boolean) {
  const opened = await gateOrDeny();
  if (!opened.gate) return { ok: false as const, code: opened.code };
  const { error } = await opened.gate.supabase
    .from("Campaign")
    .update({ show_card_price: showCardPrice })
    .eq("id", 1);
  if (error) return { ok: false as const, code: "rejected" as const };
  revalidateOperator("campaign-settings");
  return { ok: true as const, locale };
}

export async function removeBanner(locale: Locale) {
  const opened = await gateOrDeny();
  if (!opened.gate) return { ok: false as const, code: opened.code };
  const { data, error } = await opened.gate.supabase.rpc("remove_campaign_banner");
  if (error) return { ok: false as const, code: "rejected" as const };
  let storageFailed = false;
  if (typeof data === "string" && data.length > 0) {
    try {
      await deleteObject(data);
    } catch {
      storageFailed = true;
    }
  }
  revalidateOperator("campaign-settings");
  return { ok: true as const, storageFailed, locale };
}
