import "server-only";
import { cache } from "react";
import { presignView } from "./r2";
import {
  readBannerKey,
  readCampaignOfferAttachments,
  readCampaignRow,
  readVisibleCampaignOffer,
  readVisibleCampaignOffers,
  type PublicAttachment,
  type PublicCampaign,
  type PublicCampaignOffer,
} from "./public-query";
import { createPublicClient } from "./supabase/public";

export type PublishedCampaign = Omit<PublicCampaign, "bannerId"> & {
  bannerUrl: string | null;
  bannerKind: "image" | "video" | null;
};

export type ViewedAttachment = PublicAttachment & { url: string };

async function withViews(rows: PublicAttachment[]): Promise<ViewedAttachment[]> {
  const viewed: ViewedAttachment[] = [];
  for (const row of rows) {
    viewed.push({ ...row, url: await presignView(row.objectKey) });
  }
  return viewed;
}

export const loadPublishedCampaign = cache(async (): Promise<PublishedCampaign | null> => {
  const supabase = createPublicClient();
  const row = await readCampaignRow(supabase);
  if (!row) return null;
  let bannerUrl: string | null = null;
  let bannerKind: "image" | "video" | null = null;
  if (row.isPublished && row.bannerId) {
    const banner = await readBannerKey(supabase, row.bannerId);
    if (banner) {
      bannerUrl = await presignView(banner.objectKey);
      bannerKind = banner.kind;
    }
  }
  return {
    isPublished: row.isPublished,
    showCardPrice: row.showCardPrice,
    whatsappDisplay: row.whatsappDisplay,
    whatsappDigits: row.whatsappDigits,
    hotlineDisplay: row.hotlineDisplay,
    hotlineDial: row.hotlineDial,
    nelSiteUrl: row.nelSiteUrl,
    bannerUrl,
    bannerKind,
  };
});

export const loadVisibleCampaignOffers = cache(async (): Promise<PublicCampaignOffer[]> => {
  return readVisibleCampaignOffers(createPublicClient());
});

export const loadVisibleCampaignOffer = cache(async (code: string): Promise<PublicCampaignOffer | null> => {
  return readVisibleCampaignOffer(createPublicClient(), code);
});

export const loadCampaignOfferAttachments = cache(async (campaignOfferId: string): Promise<ViewedAttachment[]> => {
  return withViews(await readCampaignOfferAttachments(createPublicClient(), campaignOfferId));
});
