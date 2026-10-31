import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { readBannerKey, readCampaignRow } from "./public-query";

function campaignClient(data: Record<string, unknown> | null) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle() {
                  return Promise.resolve({ data, error: null });
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

const stored = {
  is_published: true,
  show_card_price: true,
  whatsapp_display: "010",
  whatsapp_digits: "2010",
  hotline_display: "199",
  hotline_dial: "199",
  nel_site_url: "https://example.com",
  banner_media_object_id: "banner-1",
};

describe("readCampaignRow contact values", () => {
  it("returns empty strings when the five contact values are null", async () => {
    const campaign = await readCampaignRow(
      campaignClient({
        is_published: false,
        show_card_price: true,
        whatsapp_display: null,
        whatsapp_digits: null,
        hotline_display: null,
        hotline_dial: null,
        nel_site_url: null,
        banner_media_object_id: null,
      }),
    );
    expect(campaign).toEqual({
      isPublished: false,
      showCardPrice: true,
      whatsappDisplay: "",
      whatsappDigits: "",
      hotlineDisplay: "",
      hotlineDial: "",
      nelSiteUrl: "",
      bannerId: null,
    });
  });

  it("throws when whatsapp digits are a number", async () => {
    await expect(
      readCampaignRow(
        campaignClient({
          ...stored,
          whatsapp_digits: 7,
        }),
      ),
    ).rejects.toThrow("public-read-failed");
  });

  it("passes a full row through unchanged", async () => {
    const campaign = await readCampaignRow(campaignClient(stored));
    expect(campaign).toEqual({
      isPublished: true,
      showCardPrice: true,
      whatsappDisplay: "010",
      whatsappDigits: "2010",
      hotlineDisplay: "199",
      hotlineDial: "199",
      nelSiteUrl: "https://example.com",
      bannerId: "banner-1",
    });
  });
});

describe("readBannerKey", () => {
  it("returns the key and kind of an image row and of a video row", async () => {
    const image = await readBannerKey(campaignClient({ object_key: "media/image.webp", kind: "image" }), "banner-1");
    const video = await readBannerKey(campaignClient({ object_key: "media/clip.mp4", kind: "video" }), "banner-1");
    expect(image).toEqual({ objectKey: "media/image.webp", kind: "image" });
    expect(video).toEqual({ objectKey: "media/clip.mp4", kind: "video" });
  });

  it("rejects any other kind", async () => {
    await expect(readBannerKey(campaignClient({ object_key: "media/image.webp", kind: "other" }), "banner-1")).rejects.toThrow(
      "public-read-failed",
    );
  });
});
