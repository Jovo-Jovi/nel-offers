import { deflateSync } from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { expect, test as spec, type Browser, type Page } from "@playwright/test";
import {
  campaignOfferPath,
  defaultLocale,
  directionFor,
  homePath,
  messagesFor,
  prefixedLocale,
  type Locale,
} from "../src/i18n/config";
import { chatLink, dialLink, orderLink } from "../src/lib/campaign-links";
import { fillMessage } from "../src/lib/fill-message";
import { calendarParts, formatPrice } from "../src/lib/format-values";
import {
  readCampaignOfferAttachments,
  readCampaignRow,
  readVisibleCampaignOffer,
  readVisibleCampaignOffers,
  type PublicCampaign,
  type PublicCampaignOffer,
} from "../src/lib/public-query";
import { createPublicClient } from "../src/lib/supabase/public";

const bandWidth = 16 * 100;
const bandHeight = 6 * 100;

function pngChunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, body, sum]);
}

function bandPng() {
  const rows: Buffer[] = [];
  for (let y = 0; y < bandHeight; y += 1) {
    const line = Buffer.alloc(1 + bandWidth * 3);
    const upper = y < bandHeight / 2;
    const red = upper ? 12 : 232;
    const green = upper ? 74 : 96;
    const blue = upper ? 158 : 28;
    for (let x = 0; x < bandWidth; x += 1) {
      const offset = 1 + x * 3;
      line[offset] = red;
      line[offset + 1] = green;
      line[offset + 2] = blue;
    }
    rows.push(line);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(bandWidth, 0);
  header.writeUInt32BE(bandHeight, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const operatorState = "e2e/.auth/operator.json";
const evidenceDir = path.join("docs", "evidence", "T04");
const locales = [defaultLocale, prefixedLocale] as const;
const widths = [320, 390, 768, 1024, 1440];

spec.describe.configure({ mode: "serial" });

function titled(left: string, right: string) {
  return `${left} \u2014 ${right}`;
}

async function loadCampaign(): Promise<PublicCampaign | null> {
  return readCampaignRow(createPublicClient());
}

async function loadRows(): Promise<PublicCampaignOffer[]> {
  return readVisibleCampaignOffers(createPublicClient());
}

async function operatorPage(browser: Browser) {
  const context = await browser.newContext({ storageState: operatorState });
  const page = await context.newPage();
  return { context, page };
}

async function setPublishedState(page: Page, next: boolean) {
  await page.goto("/en/operator/overview");
  const toggle = page.getByRole("switch", { name: "Published" });
  await expect(toggle).toBeVisible();
  if (((await toggle.getAttribute("aria-checked")) === "true") === next) return;
  await toggle.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(toggle).toHaveAttribute("aria-checked", next ? "true" : "false");
}

async function bannerSize(page: Page) {
  const image = page.locator("img[data-banner-key]");
  if ((await image.count()) === 0) return null;
  await expect
    .poll(() => image.evaluate((node: HTMLImageElement) => (node.complete ? node.naturalWidth : 0)))
    .toBeGreaterThan(0);
  return image.evaluate((node: HTMLImageElement) => ({
    width: node.naturalWidth,
    height: node.naturalHeight,
  }));
}

async function ensureBanner(page: Page) {
  await page.goto("/en/operator/campaign-settings");
  const current = page.locator("img[data-banner-key]");
  const size = await bannerSize(page);
  if (size?.width === bandWidth && size.height === bandHeight) return;
  await page.locator("#banner").setInputFiles({
    name: "banner.png",
    mimeType: "image/png",
    buffer: bandPng(),
  });
  const button = page.getByRole("button", { name: size ? "Replace banner" : "Upload banner" });
  await expect(button).toBeEnabled({ timeout: 60 * 1000 });
  await button.click();
  await expect(current).toBeVisible({ timeout: 60 * 1000 });
  await expect.poll(() => bannerSize(page)).toEqual({ width: bandWidth, height: bandHeight });
}

async function setCardPriceShown(page: Page, next: boolean) {
  await page.goto("/en/operator/campaign-settings");
  const toggle = page.getByRole("switch", { name: "Show the price on the home cards" });
  await expect(toggle).toBeVisible();
  if (((await toggle.getAttribute("aria-checked")) === "true") === next) return;
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", next ? "true" : "false");
}

spec.afterAll(async ({ browser }) => {
  const { context, page } = await operatorPage(browser);
  try {
    await setPublishedState(page, false);
    await setCardPriceShown(page, true);
  } finally {
    await context.close();
  }
});

spec("synthetic codes only", async ({ browser }) => {
  const { context, page } = await operatorPage(browser);
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/operator/campaign-offers");
    const codes = await page.locator("[data-code]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-code") ?? ""),
    );
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) expect(code.startsWith("SYN-")).toBe(true);
  } finally {
    await context.close();
  }
});

spec("coming soon before publishing", async ({ page }) => {
  for (const locale of locales) {
    const response = await page.goto(homePath(locale));
    expect(response?.status()).toBe(200);
    const messages = messagesFor(locale);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", directionFor(locale));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.home.comingSoon);
    await expect(page.getByRole("link", { name: messages.header.labSite })).toHaveCount(0);
    await expect(page.locator("a[href^='tel:']")).toHaveCount(0);
    await expect(page.locator("a[href*='wa.me']")).toHaveCount(0);
    await expect(page).toHaveTitle(titled(messages.site.campaignTitle, messages.site.name));
  }
  const missing = await page.goto(campaignOfferPath(defaultLocale, "SYN-001"));
  expect(missing?.status()).toBe(404);
  const messages = messagesFor(defaultLocale);
  await expect(page.locator("html")).toHaveAttribute("lang", defaultLocale);
  await expect(page.locator("html")).toHaveAttribute("dir", directionFor(defaultLocale));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.campaignOffer.notFound);
});

spec("publish the campaign", async ({ browser }) => {
  spec.setTimeout(180 * 1000);
  const { context, page } = await operatorPage(browser);
  try {
    await ensureBanner(page);
    await setPublishedState(page, true);
  } finally {
    await context.close();
  }
  const campaign = await loadCampaign();
  expect(campaign).toBeTruthy();
  const rows = await loadRows();
  expect(rows.map((row) => row.code)).toEqual(["SYN-001", "SYN-002", "SYN-003", "SYN-006"]);
});

spec("home matches the public query", async ({ page }) => {
  const campaign = await loadCampaign();
  const rows = await loadRows();
  expect(campaign).toBeTruthy();
  if (!campaign) return;
  for (const locale of locales) {
    const messages = messagesFor(locale);
    const response = await page.goto(homePath(locale));
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(titled(messages.site.campaignTitle, messages.site.name));
    await expect(page.getByRole("img", { name: messages.a11y.banner })).toBeVisible();
    const chat = chatLink(campaign.whatsappDigits);
    const dial = dialLink(campaign.hotlineDial);
    await expect(page.locator(`a[href="${chat}"]`)).toHaveCount(2);
    await expect(page.locator(`a[href="${dial}"]`)).toHaveCount(2);
    const lab = page.getByRole("link", { name: messages.header.labSite });
    await expect(lab).toHaveAttribute("href", campaign.nelSiteUrl);
    await expect(lab).toHaveAttribute("target", "_blank");
    await expect(page.locator("footer")).toContainText(campaign.hotlineDisplay);
    await expect(page.locator("footer")).toContainText(campaign.whatsappDisplay);
    const cards = page.locator("[data-campaign-offer-card]");
    await expect(cards).toHaveCount(rows.length);
    const codes = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-code")));
    expect(codes).toEqual(rows.map((row) => row.code));
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (!row) continue;
      const card = page.locator(`[data-code="${row.code}"]`);
      const name = locale === defaultLocale ? row.nameAr : row.nameEn;
      await expect(card.locator("a > span").first()).toHaveText(String(index + 1).padStart(2, "0"));
      await expect(card).toContainText(row.code);
      await expect(card).toContainText(name);
      if (campaign.showCardPrice) {
        await expect(card).toContainText(formatPrice(locale, row.priceText));
        await expect(card).toContainText(messages.campaignOffer.currency);
      }
    }
  }
});

spec("search and the price switch", async ({ page, browser }) => {
  spec.setTimeout(240 * 1000);
  const arabic = messagesFor(defaultLocale);
  const english = messagesFor(prefixedLocale);
  await page.goto(homePath(defaultLocale));
  const search = page.getByRole("searchbox", { name: arabic.home.searchPlaceholder });
  await search.fill("\u062A\u062C\u0631\u064A\u0628\u0649 01");
  await expect(page.locator("[data-code='SYN-001']")).toBeVisible();
  await expect(page.locator("[data-code='SYN-002']")).toBeHidden();
  await page.goto(homePath(prefixedLocale));
  await page.getByRole("searchbox", { name: english.home.searchPlaceholder }).fill("sYnThEtIc AnAlYsIs 02");
  await expect(page.locator("[data-code='SYN-002']")).toBeVisible();
  await expect(page.locator("[data-code='SYN-001']")).toBeHidden();
  await page.getByRole("searchbox", { name: english.home.searchPlaceholder }).fill("zzzz");
  await expect(page.locator("[data-no-matches]")).toBeVisible();
  await expect(page.locator("[data-no-matches]")).toHaveText(english.home.noMatches);
  await expect(page.locator("[data-campaign-offer-grid]")).toBeHidden();

  const { context, page: operator } = await operatorPage(browser);
  try {
    await setCardPriceShown(operator, false);
    const hiddenPrice = await loadCampaign();
    expect(hiddenPrice?.showCardPrice).toBe(false);
    const rows = await loadRows();
    for (const locale of locales) {
      await page.goto(homePath(locale));
      for (const row of rows) {
        await expect(page.locator(`[data-code="${row.code}"]`)).not.toContainText(formatPrice(locale, row.priceText));
      }
      for (const row of rows) {
        await page.goto(campaignOfferPath(locale, row.code));
        await expect(page.locator("main")).toContainText(formatPrice(locale, row.priceText));
        await expect(page.locator("main")).toContainText(messagesFor(locale).campaignOffer.currency);
      }
    }
    await setCardPriceShown(operator, true);
  } finally {
    await context.close();
  }
});

async function expectPage(page: Page, locale: Locale, row: PublicCampaignOffer, campaign: PublicCampaign) {
  const messages = messagesFor(locale);
  const response = await page.goto(campaignOfferPath(locale, row.code));
  expect(response?.status()).toBe(200);
  const name = locale === defaultLocale ? row.nameAr : row.nameEn;
  const otherName = locale === defaultLocale ? row.nameEn : row.nameAr;
  await expect(page).toHaveTitle(titled(name, messages.site.name));
  await expect(page.locator("h1")).toHaveText(name);
  await expect(page.getByText(otherName, { exact: true })).toBeVisible();
  await expect(page.getByText(row.code, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(formatPrice(locale, row.priceText), { exact: true }).first()).toBeVisible();
  await expect(page.getByText(messages.campaignOffer.currency, { exact: true }).first()).toBeVisible();
  const parts = calendarParts(row.endsOn);
  expect(parts).toBeTruthy();
  const expiry = page.getByText(messages.campaignOffer.endsOnLabel, { exact: true }).locator("..");
  const values = expiry.locator(".border-b-2");
  await expect(values).toHaveCount(3);
  await expect(values.nth(0)).toHaveText(parts?.day ?? "");
  await expect(values.nth(1)).toHaveText(parts?.month ?? "");
  await expect(values.nth(2)).toHaveText(parts?.year ?? "");
  const conditions = locale === defaultLocale ? row.conditionsAr : row.conditionsEn;
  const heading = page.getByRole("heading", { name: messages.campaignOffer.conditionsHeading });
  if (conditions) {
    await expect(heading).toBeVisible();
    await expect(page.getByText(conditions, { exact: true })).toBeVisible();
  } else {
    await expect(heading).toHaveCount(0);
  }
  const orderMessage = fillMessage(messages.campaignOffer.orderMessage, { code: row.code, name });
  const actions = page.locator("[data-actions]");
  await expect(actions.locator("a").nth(0)).toHaveAttribute("href", dialLink(campaign.hotlineDial));
  await expect(actions.locator("a").nth(1)).toHaveAttribute("href", orderLink(campaign.whatsappDigits, orderMessage));
  const stored = await readVisibleCampaignOffer(createPublicClient(), row.code);
  expect(stored?.code).toBe(row.code);
  expect(stored?.priceText).toBe(row.priceText);
  expect(stored?.endsOn).toBe(row.endsOn);
}

spec("campaign offer pages match the public query", async ({ page }) => {
  spec.setTimeout(240 * 1000);
  const campaign = await loadCampaign();
  const rows = await loadRows();
  expect(campaign).toBeTruthy();
  if (!campaign) return;
  for (const locale of locales) {
    for (const row of rows) await expectPage(page, locale, row, campaign);
  }
  const imageRow = rows.find((row) => row.code === "SYN-001");
  const clipRow = rows.find((row) => row.code === "SYN-002");
  expect(imageRow).toBeTruthy();
  expect(clipRow).toBeTruthy();
  if (!imageRow || !clipRow) return;
  const messages = messagesFor(defaultLocale);
  await page.goto(campaignOfferPath(defaultLocale, "SYN-001"));
  const pictures = await readCampaignOfferAttachments(createPublicClient(), imageRow.id);
  const mainAlt = fillMessage(messages.campaignOffer.galleryAlt, {
    position: "1",
    name: imageRow.nameAr,
  });
  await expect(page.getByRole("img", { name: mainAlt })).toBeVisible();
  const galleries = pictures.filter((entry) => entry.slot.startsWith("gallery"));
  expect(galleries.length).toBeGreaterThan(0);
  await expect(page.locator("video")).toHaveCount(0);
  await page.goto(campaignOfferPath(defaultLocale, "SYN-002"));
  const clipPictures = await readCampaignOfferAttachments(createPublicClient(), clipRow.id);
  const video = page.locator("video");
  await expect(video).toBeVisible();
  await expect(page.getByRole("button", { name: messages.a11y.playVideo })).toBeVisible();
  const poster = await video.getAttribute("poster");
  if (clipPictures.some((entry) => entry.slot === "main_image")) expect(poster).toBeTruthy();
  else expect(poster).toBeNull();
});

async function assertPreviewPicture(page: Page) {
  const image = page.locator("dialog img");
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
    .toBe(true);
  const box = await image.boundingBox();
  const viewport = page.viewportSize();
  expect(box).toBeTruthy();
  expect(viewport).toBeTruthy();
  if (!box || !viewport) return;
  const covers = box.width >= viewport.width * 0.9 || box.height >= viewport.height * 0.9;
  console.log(
    `preview-image-box ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)} viewport ${viewport.width}x${viewport.height}`,
  );
  expect(covers).toBe(true);
  const hit = await page.evaluate(() => {
    const node = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    return node instanceof HTMLImageElement;
  });
  expect(hit).toBe(true);
}

async function assertPicturesLoaded(page: Page, pictures: ReturnType<Page["locator"]>) {
  const count = await pictures.count();
  for (let index = 0; index < count; index += 1) {
    const picture = pictures.nth(index);
    await expect
      .poll(() => picture.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0))
      .toBe(true);
  }
  return count;
}

async function assertFrame(page: Page) {
  const measured = await page.locator("figure").evaluate((node) => {
    const frame = node.querySelector(":scope > div");
    const painted = node.querySelector("img, video");
    if (!(frame instanceof HTMLElement) || !(painted instanceof HTMLElement)) return null;
    const frameBox = frame.getBoundingClientRect();
    const paintedBox = painted.getBoundingClientRect();
    return {
      inner: node.clientHeight,
      frame: frameBox.height,
      paintedHeight: paintedBox.height,
      frameWidth: frameBox.width,
      paintedWidth: paintedBox.width,
    };
  });
  expect(measured).toBeTruthy();
  if (!measured) return;
  expect(Math.abs(measured.inner - measured.frame)).toBeLessThanOrEqual(2);
  expect(Math.abs(measured.paintedHeight - measured.frame)).toBeLessThanOrEqual(2);
  expect(Math.abs(measured.paintedWidth - measured.frameWidth)).toBeLessThanOrEqual(2);
}

async function movePreview(page: Page, locale: Locale, count: number) {
  const messages = messagesFor(locale);
  const dialog = page.locator("dialog");
  const nextKey = locale === defaultLocale ? "ArrowLeft" : "ArrowRight";
  const previousKey = locale === defaultLocale ? "ArrowRight" : "ArrowLeft";
  await expect(dialog).toContainText(`1 / ${count}`);
  await page.getByRole("button", { name: messages.a11y.nextImage }).click();
  await expect(dialog).toContainText(`2 / ${count}`);
  await page.getByRole("button", { name: messages.a11y.previousImage }).click();
  await expect(dialog).toContainText(`1 / ${count}`);
  await page.keyboard.press(nextKey);
  await expect(dialog).toContainText(`2 / ${count}`);
  await page.keyboard.press(previousKey);
  await expect(dialog).toContainText(`1 / ${count}`);
  const box = await dialog.boundingBox();
  expect(box).toBeTruthy();
  if (!box) return;
  const y = box.y + box.height * 0.25;
  const startX = box.x + box.width * 0.55;
  const endX = locale === defaultLocale ? startX + 80 : startX - 80;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 8 });
  await page.mouse.up();
  await expect(dialog).toContainText(`2 / ${count}`);
}

spec("gallery preview", async ({ page }) => {
  spec.setTimeout(180 * 1000);
  const rows = await loadRows();
  const imageRow = rows.find((row) => row.code === "SYN-001");
  expect(imageRow).toBeTruthy();
  if (!imageRow) return;
  const pictures = await readCampaignOfferAttachments(createPublicClient(), imageRow.id);
  const count = pictures.filter((entry) => entry.slot === "main_image" || entry.slot.startsWith("gallery")).length;
  expect(count).toBeGreaterThan(1);
  fs.mkdirSync(evidenceDir, { recursive: true });
  for (const locale of locales) {
    const messages = messagesFor(locale);
    const name = locale === defaultLocale ? imageRow.nameAr : imageRow.nameEn;
    const mainAlt = fillMessage(messages.campaignOffer.galleryAlt, { position: "1", name });
    const thumbLabel = fillMessage(messages.campaignOffer.imageLabel, { position: "1" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(campaignOfferPath(locale, imageRow.code));
    const opener = page.getByRole("button", { name: mainAlt, exact: true });
    await opener.click();
    const dialog = page.locator("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/public-scroll-lock/);
    await movePreview(page, locale, count);
    await assertPreviewPicture(page);
    if (locale === defaultLocale) {
      await page.screenshot({ path: path.join(evidenceDir, "gallery-preview-ar-390.png") });
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator("html")).not.toHaveClass(/public-scroll-lock/);
    const thumb = page.locator("ul button").filter({ hasText: thumbLabel }).first();
    await thumb.click();
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(`2 / ${count}`);
    const box = await dialog.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;
    await page.mouse.click(box.x + box.width * 0.15, box.y + box.height * 0.8);
    await expect(dialog).toBeHidden();
    await expect(thumb).toBeFocused();
  }
});

spec("not found", async ({ page }) => {
  const cases = [
    { urlPath: campaignOfferPath(defaultLocale, "SYN-404"), locale: defaultLocale },
    { urlPath: campaignOfferPath(prefixedLocale, "SYN-404"), locale: prefixedLocale },
    { urlPath: campaignOfferPath(defaultLocale, "SYN-004"), locale: defaultLocale },
    { urlPath: campaignOfferPath(prefixedLocale, "SYN-004"), locale: prefixedLocale },
    { urlPath: campaignOfferPath(defaultLocale, "SYN-005"), locale: defaultLocale },
    { urlPath: campaignOfferPath(prefixedLocale, "SYN-005"), locale: prefixedLocale },
    { urlPath: "/fr", locale: defaultLocale },
    { urlPath: "/en/nope", locale: prefixedLocale },
  ];
  for (const entry of cases) {
    const response = await page.goto(entry.urlPath);
    expect(response?.status()).toBe(404);
    const messages = messagesFor(entry.locale);
    await expect(page.locator("html")).toHaveAttribute("lang", entry.locale);
    await expect(page.locator("html")).toHaveAttribute("dir", directionFor(entry.locale));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(messages.campaignOffer.notFound);
  }
});

spec("layout, screenshots and unpublish", async ({ page, browser }) => {
  spec.setTimeout(360 * 1000);
  fs.mkdirSync(evidenceDir, { recursive: true });
  const hosts = new Set<string>();
  const violations: string[] = [];
  page.on("request", (request) => {
    hosts.add(new URL(request.url()).host);
  });
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) violations.push("csp");
  });
  const shots: Record<string, string> = {
    [`${homePath(defaultLocale)}@390`]: "home-ar-390.png",
    [`${homePath(defaultLocale)}@1440`]: "home-ar-1440.png",
    [`${homePath(prefixedLocale)}@390`]: "home-en-390.png",
    [`${homePath(prefixedLocale)}@1440`]: "home-en-1440.png",
    [`${campaignOfferPath(defaultLocale, "SYN-001")}@390`]: "campaign-offer-image-ar-390.png",
    [`${campaignOfferPath(defaultLocale, "SYN-001")}@1440`]: "campaign-offer-image-ar-1440.png",
    [`${campaignOfferPath(prefixedLocale, "SYN-001")}@390`]: "campaign-offer-image-en-390.png",
    [`${campaignOfferPath(prefixedLocale, "SYN-001")}@1440`]: "campaign-offer-image-en-1440.png",
    [`${campaignOfferPath(defaultLocale, "SYN-002")}@390`]: "campaign-offer-video-ar-390.png",
    [`${campaignOfferPath(defaultLocale, "SYN-002")}@1440`]: "campaign-offer-video-ar-1440.png",
    [`${campaignOfferPath(prefixedLocale, "SYN-002")}@390`]: "campaign-offer-video-en-390.png",
    [`${campaignOfferPath(prefixedLocale, "SYN-002")}@1440`]: "campaign-offer-video-en-1440.png",
  };
  const publishedPaths = [
    homePath(defaultLocale),
    homePath(prefixedLocale),
    campaignOfferPath(defaultLocale, "SYN-001"),
    campaignOfferPath(prefixedLocale, "SYN-001"),
    campaignOfferPath(defaultLocale, "SYN-002"),
    campaignOfferPath(prefixedLocale, "SYN-002"),
    campaignOfferPath(defaultLocale, "SYN-404"),
    campaignOfferPath(prefixedLocale, "SYN-404"),
  ];
  for (const urlPath of publishedPaths) {
    const served = await page.request.get(urlPath);
    const html = await served.text();
    expect(html.includes("style="), urlPath).toBe(false);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(urlPath, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1")).toBeVisible();
      const locale = urlPath.startsWith("/en") ? prefixedLocale : defaultLocale;
      if (urlPath === homePath(locale)) {
        const loaded = await assertPicturesLoaded(page, page.getByRole("img", { name: messagesFor(locale).a11y.banner }));
        expect(loaded).toBeGreaterThan(0);
      }
      if (urlPath === campaignOfferPath(locale, "SYN-001")) {
        expect(await assertPicturesLoaded(page, page.locator("figure img"))).toBeGreaterThan(0);
        expect(await assertPicturesLoaded(page, page.locator("ul img"))).toBeGreaterThan(0);
      }
      if (urlPath === campaignOfferPath(locale, "SYN-002")) {
        await assertPicturesLoaded(page, page.locator("figure img"));
        await assertPicturesLoaded(page, page.locator("ul img"));
      }
      if (
        (urlPath === campaignOfferPath(locale, "SYN-001") || urlPath === campaignOfferPath(locale, "SYN-002")) &&
        (width === 768 || width === 1024 || width === 1440)
      ) {
        await assertFrame(page);
      }
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(fits, `${urlPath} ${width}`).toBe(true);
      const shot = shots[`${urlPath}@${width}`];
      if (shot) await page.screenshot({ path: path.join(evidenceDir, shot) });
    }
  }
  const { context, page: operator } = await operatorPage(browser);
  try {
    await setPublishedState(operator, false);
  } finally {
    await context.close();
  }
  for (const locale of locales) {
    const urlPath = homePath(locale);
    const served = await page.request.get(urlPath);
    const html = await served.text();
    expect(html.includes("style="), urlPath).toBe(false);
    expect(served.status()).toBe(200);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(urlPath, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".nel-shimmer")).toHaveCount(0);
      const heading = page.getByRole("heading", { level: 1, name: messagesFor(locale).home.comingSoon });
      await expect(heading).toBeVisible();
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(fits, `${urlPath} ${width}`).toBe(true);
      if (width === 390) {
        await page.screenshot({ path: path.join(evidenceDir, `coming-soon-${locale}-390.png`) });
      }
    }
  }
  expect(violations).toEqual([]);
  expect(await page.context().cookies()).toHaveLength(0);
  for (const host of hosts) {
    const allowed = host === "localhost:3000" || host.endsWith(".r2.cloudflarestorage.com");
    expect(allowed, host).toBe(true);
  }
  const campaign = await loadCampaign();
  expect(campaign).toBeNull();
});
