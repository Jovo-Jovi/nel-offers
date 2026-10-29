import fs from "node:fs";
import path from "node:path";
import { expect, test as spec, type Page } from "@playwright/test";
import { messagesFor } from "../src/i18n/config";
import { tinyPng } from "./support/samples";

const evidenceDir = path.join("docs", "evidence", "T05");
const followUpDir = path.join("docs", "evidence", "T05-F2");
const statusWords = {
  ar: ["ظاهر الآن", "يبدأ لاحقًا", "انتهى", "موقوف", "غير منشور"],
  en: ["Visible now", "Starts later", "Ended", "Switched off", "Not published"],
} as const;
const legendStart = {
  ar: "ظاهر الآن: يراه الزوار اليوم",
  en: "Visible now: visitors see it today",
} as const;
const segments = ["overview", "campaign-offers", "import", "media-objects", "campaign-settings"] as const;

async function upload(page: Page) {
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  const dialog = page.getByRole("dialog");
  try {
    await dialog.waitFor({ state: "visible", timeout: 2000 });
    await dialog.getByRole("button", { name: "Confirm" }).click();
  } catch {
    return;
  }
}

async function dropOnBody(page: Page) {
  const before = page.url();
  await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["x"], "dropped.png", { type: "image/png" }));
    const dropped = new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer });
    document.body.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    document.body.dispatchEvent(dropped);
  });
  expect(page.url()).toBe(before);
}

async function shot(page: Page, name: string, dir = evidenceDir) {
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".nel-shimmer")).toHaveCount(0);
  const width = page.viewportSize()?.width ?? 0;
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, name), fullPage: width >= 1024 });
}

spec("operator controls, media choice and dashboard screenshots", async ({ page }) => {
  spec.setTimeout(480 * 1000);
  const arabic = messagesFor("ar");
  try {
    for (const locale of ["ar", "en"] as const) {
      for (const segment of segments) {
        await page.goto(`/${locale}/operator/${segment}`);
        await dropOnBody(page);
      }
    }

    for (const locale of ["ar", "en"] as const) {
      for (const width of [390, 1440] as const) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        await page.goto(`/${locale}/operator/overview`);
        await shot(page, `dashboard-overview-${locale}-${width}.png`);
        if (locale === "en" && width === 1440) {
          await expect(page.getByText(legendStart.en)).toBeVisible();
          for (const word of statusWords.en) await expect(page.getByRole("main")).toContainText(word);
          await shot(page, "overview-legend-en-1440.png", followUpDir);
        }
        await page.goto(`/${locale}/operator/campaign-offers`);
        await expect(page.locator("[data-code='SYN-001'] [data-filled='yes'] img").first()).toBeVisible();
        await shot(page, `dashboard-campaign-offers-${locale}-${width}.png`);
        if ((locale === "ar" && width === 390) || (locale === "en" && width === 1440)) {
          for (const word of statusWords[locale]) await expect(page.getByRole("main")).toContainText(word);
          await expect(page.getByText(legendStart[locale])).toBeVisible();
          if (locale === "ar") await shot(page, "campaign-offers-legend-ar-390.png", followUpDir);
        }
      }
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en/operator/campaign-offers");
    const card = page.locator("[data-code='SYN-001']");
    await expect(card).toContainText("Until");
    const shownLabel = card.locator("[data-shown-label]");
    await expect(shownLabel).toHaveText("Shown on the site");
    const filledTiles = card.locator("[data-filled='yes']");
    const emptyTiles = card.locator("[data-filled='no']");
    expect(await filledTiles.count()).toBeGreaterThan(0);
    expect(await emptyTiles.count()).toBeGreaterThan(0);
    for (let index = 0; index < (await filledTiles.count()); index += 1) {
      const tile = filledTiles.nth(index);
      await expect(tile.locator("img, video")).toHaveCount(1);
      await expect(tile.getByRole("link", { name: "Replace", exact: true })).toBeVisible();
      await expect(tile.getByRole("button", { name: /^Remove / })).toBeVisible();
    }
    for (let index = 0; index < (await emptyTiles.count()); index += 1) {
      const tile = emptyTiles.nth(index);
      await expect(tile.locator("img, video")).toHaveCount(0);
      await expect(tile.getByRole("link", { name: "Add", exact: true })).toBeVisible();
    }
    await card.getByRole("switch", { name: "Shown on the site" }).click();
    await expect(shownLabel).toHaveText("Shown on the site");
    await expect(card).toContainText("Switched off");
    await page.goto("/en/operator/overview");
    await page.getByRole("switch", { name: "Published" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByRole("switch", { name: "Published" })).toHaveAttribute("aria-checked", "true");
    const hidden = await page.goto("/ar/campaign-offers/SYN-001");
    expect(hidden?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(arabic.campaignOffer.notFound);
    await page.goto("/ar");
    await expect(page.locator("[data-code='SYN-001']")).toHaveCount(0);
    await page.goto("/en/operator/campaign-offers");
    await page.locator("[data-code='SYN-001']").getByRole("switch", { name: "Shown on the site" }).click();
    await expect(page.locator("[data-code='SYN-001']")).toContainText("Visible now");
    const restored = await page.goto("/ar/campaign-offers/SYN-001");
    expect(restored?.status()).toBe(200);
    await page.goto("/ar");
    await expect(page.locator("[data-code='SYN-001']")).toBeVisible();
    await page.goto("/en/operator/overview");
    await page.getByRole("switch", { name: "Published" }).click();
    await expect(page.getByRole("dialog")).toContainText("coming-soon");
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByRole("switch", { name: "Published" })).toHaveAttribute("aria-checked", "false");

    await page.goto("/en/operator/media-objects");
    await page.getByRole("tab", { name: "Videos" }).click();
    await expect(page.locator("#uploads-videos")).toHaveAttribute("accept", /video\/mp4/);
    await page.getByRole("tab", { name: "Images" }).click();
    const imageAccept = await page.locator("#uploads-images").getAttribute("accept");
    expect(imageAccept).toContain("image/jpeg");
    expect(imageAccept).toContain("image/png");
    expect(imageAccept).toContain("image/webp");
    expect(imageAccept).toContain(".jpg");
    expect(imageAccept).not.toContain("gif");

    const webp = Buffer.from("RIFF");
    const videoType = await page.request.post("/api/operator/media-objects/presign", {
      data: { code: "SYN-001", slot: "main_video", type: "image/webp", size: webp.length },
    });
    expect(videoType.status()).toBe(422);
    const unknown = await page.request.post("/api/operator/media-objects/presign", {
      data: { code: "NO-SUCH", slot: "main_image", type: "image/webp", size: webp.length },
    });
    expect(unknown.status()).toBe(422);
    const named = await page.request.post("/api/operator/media-objects/presign", {
      data: { name: "chosen-picture.png", code: "SYN-001", slot: "main_image", type: "image/webp", size: webp.length },
    });
    expect(named.status()).toBe(422);

    const posted: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/api/operator/media-objects/presign")) {
        posted.push(request.postData() ?? "");
      }
    });

    await page.locator("#uploads-images").setInputFiles([
      { name: "picture-a.png", mimeType: "image/png", buffer: tinyPng },
      { name: "picture-b.png", mimeType: "image/png", buffer: tinyPng },
    ]);
    await expect(page.locator("[data-byte-size]").first()).toHaveText(/\d[\d.,]*\s*(B|byte|kB|KB|MB)\b/);
    const queued = page.locator("[data-upload]");
    await queued.nth(0).getByLabel("Campaign offer").selectOption("SYN-004");
    await queued.nth(0).getByLabel("Slot").selectOption("gallery_3");
    await queued.nth(1).getByLabel("Campaign offer").selectOption("SYN-004");
    await queued.nth(1).getByLabel("Slot").selectOption("gallery_3");
    await expect(page.getByText("Another row already uses this slot.")).toBeVisible();
    await expect(page.locator("[data-upload='refused']").last()).toBeVisible();
    await page.getByRole("button", { name: "Clear list" }).click();
    await expect(page.locator("[data-upload]")).toHaveCount(0);

    await page.locator("#uploads-images").setInputFiles({
      name: "chosen-picture.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    const choice = page.locator("[data-upload='waiting']");
    await expect(choice.getByText("Choose a campaign offer and a slot.")).toBeVisible();
    await choice.getByLabel("Campaign offer").selectOption("SYN-002");
    await choice.getByLabel("Slot").selectOption("gallery_2");
    await upload(page);
    await expect(page.locator("[data-library='SYN-002:gallery_2']")).toBeVisible({ timeout: 120 * 1000 });

    for (const locale of ["en", "ar"] as const) {
      await page.goto(`/${locale}/operator/media-objects`);
      await page.getByRole("tab", { name: locale === "ar" ? "صور" : "Images" }).click();
      await page.locator("#uploads-images").setInputFiles({
        name: "chosen-picture.png",
        mimeType: "image/png",
        buffer: tinyPng,
      });
      const queued = page.locator("[data-upload='waiting']");
      await queued.getByLabel(locale === "ar" ? "عرض الحملة" : "Campaign offer").selectOption("SYN-002");
      await queued.getByLabel(locale === "ar" ? "الخانة" : "Slot").selectOption("gallery_2");
      await expect(page.getByText(locale === "ar" ? "معيَّن" : "Assigned").first()).toBeVisible();
      await expect(page.getByText(locale === "ar" ? "يستبدل" : "Replaces").first()).toBeVisible();
      for (const width of [390, 1440] as const) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        await shot(page, `dashboard-media-objects-${locale}-${width}.png`);
      }
      if (locale === "en") {
        await page.setViewportSize({ width: 1280, height: 800 });
        await upload(page);
      }
    }
    await page.goto("/ar/operator/campaign-offers");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-code='SYN-002']").getByRole("button", { name: "حذف معرض 2" }).click();
    await expect(page.getByRole("dialog")).toContainText("SYN-002");
    await shot(page, "confirm-remove-slot-ar-390.png");
    await page.evaluate(() => {
      const marker = { saw: false };
      const observer = new MutationObserver(() => {
        if (document.querySelector("[data-code='SYN-002'] [data-leaving='true']")) marker.saw = true;
      });
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });
      Object.assign(window, { slotLeave: marker });
    });
    await page.getByRole("dialog").getByRole("button", { name: "تأكيد" }).click();
    await expect(page.locator("[data-code='SYN-002']").locator("[data-filled='yes']", { hasText: "معرض 2" })).toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & { slotLeave?: { saw: boolean } }).slotLeave?.saw === true)).toBe(true);

    await page.goto("/en/operator/media-objects");
    const libraryRow = page.locator("[data-library='SYN-005:main_image']");
    await libraryRow.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("dialog")).toContainText("SYN-005");
    await expect(page.getByRole("dialog")).toContainText("Main image");
    await page.evaluate(() => {
      const marker = { saw: false };
      const observer = new MutationObserver(() => {
        if (document.querySelector("[data-library='SYN-005:main_image'][data-leaving='true']")) marker.saw = true;
      });
      observer.observe(document.body, { attributes: true, childList: true, subtree: true });
      Object.assign(window, { libraryLeave: marker });
    });
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
    await expect(libraryRow).toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & { libraryLeave?: { saw: boolean } }).libraryLeave?.saw === true)).toBe(true);

    await page.goto("/en/operator/campaign-offers");
    const clip = page.locator("[data-code='SYN-003']");
    const mainImage = clip.getByRole("button", { name: "Remove Main image" });
    if ((await mainImage.count()) > 0) {
      await mainImage.click();
      await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
    }
    await page.goto("/en/operator/media-objects");
    await page.getByRole("tab", { name: "Videos" }).click();
    await page.locator("#uploads-videos").setInputFiles({
      name: "SYN-003.mp4",
      mimeType: "video/mp4",
      buffer: fs.readFileSync("e2e/support/synthetic-frame.mp4"),
    });
    await upload(page);
    await expect(page.locator("[data-upload='done']").last()).toBeVisible({ timeout: 180 * 1000 });

    for (const locale of ["ar", "en"] as const) {
      for (const width of [320, 390] as const) {
        await page.setViewportSize({ width, height: 700 });
        await page.goto(`/${locale}/operator/overview`);
        await expect(page.locator("h1")).toBeVisible();
        await expect(page.locator(".nel-shimmer")).toHaveCount(0);
        const fits = await page.locator("[data-nav-short]").evaluateAll((nodes) =>
          nodes.every((node) => node instanceof HTMLElement && node.scrollWidth <= node.clientWidth),
        );
        expect(fits).toBe(true);
      }
    }

    for (const raw of posted) {
      const body = JSON.parse(raw) as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(body, "name")).toBe(false);
      expect(JSON.stringify(body)).not.toMatch(/\.png|\.jpe?g|\.webp|\.mp4/i);
    }
  } finally {
    await page.goto("/en/operator/campaign-offers");
    const restored = page.locator("[data-code='SYN-001']").getByRole("switch", { name: "Shown on the site" });
    if ((await restored.count()) > 0 && (await restored.getAttribute("aria-checked")) !== "true") {
      await restored.click();
    }
    await page.goto("/en/operator/overview");
    const published = page.getByRole("switch", { name: "Published" });
    if ((await published.getAttribute("aria-checked")) === "true") {
      await published.click();
      await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
    }
  }
});

spec("a running action shows its spinner, and reduced motion skips the leaving mark", async ({ page }) => {
  spec.setTimeout(120 * 1000);
  await page.goto("/en/operator/campaign-offers");
  const card = page.locator("[data-code='SYN-001']");
  const toggle = card.getByRole("switch", { name: "Shown on the site" });
  let pause = true;
  await page.route("**/*", async (route) => {
    const action = route.request().headers()["next-action"];
    if (pause && route.request().method() === "POST" && action) {
      pause = false;
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({ response });
      return;
    }
    await route.continue();
  });
  try {
    const done = page.waitForResponse((response) => Boolean(response.request().headers()["next-action"]));
    const clicked = toggle.click({ noWaitAfter: true });
    await expect(toggle).toBeDisabled();
    await expect(card.locator(".animate-spin")).toBeVisible();
    await done;
    await clicked;
  } finally {
    pause = false;
    await page.unroute("**/*");
  }
  if ((await toggle.getAttribute("aria-checked")) !== "true") {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  }

  await page.goto("/en/operator/media-objects");
  await page.getByRole("tab", { name: "Images" }).click();
  await page.locator("#uploads-images").setInputFiles({
    name: "SYN-004-3.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });
  await upload(page);
  await expect(page.locator("[data-library='SYN-004:gallery_3']")).toBeVisible({ timeout: 120 * 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/operator/campaign-offers");
  const removal = page.locator("[data-code='SYN-004']").getByRole("button", { name: "Remove Gallery 3", exact: true });
  await expect(removal).toBeVisible();
  await removal.click();
  await page.evaluate(() => {
    const marker = { saw: false };
    const observer = new MutationObserver(() => {
      if (document.querySelector("[data-leaving]")) marker.saw = true;
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    Object.assign(window, { leaveMark: marker });
  });
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(removal).toHaveCount(0);
  const saw = await page.evaluate(() => {
    const marker = (window as Window & { leaveMark?: { saw: boolean } }).leaveMark;
    return marker?.saw === true;
  });
  expect(saw).toBe(false);
});
