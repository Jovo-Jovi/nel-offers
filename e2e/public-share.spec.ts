import fs from "node:fs";
import path from "node:path";
import { expect, test as spec, type Browser, type Page } from "@playwright/test";
import { messagesFor } from "../src/i18n/config";

const evidenceDir = path.join("docs", "evidence", "T05");

async function operatorPage(browser: Browser) {
  const context = await browser.newContext({ storageState: "e2e/.auth/operator.json" });
  const page = await context.newPage();
  return { context, page };
}

async function setPublished(page: Page, next: boolean) {
  await page.goto("/en/operator/overview");
  const toggle = page.getByRole("switch", { name: "Published" });
  if (((await toggle.getAttribute("aria-checked")) === "true") === next) return;
  await toggle.click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(toggle).toHaveAttribute("aria-checked", next ? "true" : "false");
}

function stored(value: string, origin: string) {
  return value.split(origin).join("<site>");
}

spec("link preview, icons, video frame and gallery margin", async ({ page, browser }) => {
  spec.setTimeout(180 * 1000);
  fs.mkdirSync(evidenceDir, { recursive: true });
  const { context, page: operator } = await operatorPage(browser);
  try {
    await setPublished(operator, true);
    const pages = ["/ar", "/en", "/ar/campaign-offers/SYN-001", "/en/campaign-offers/SYN-001"] as const;
    const meta: Record<string, Record<string, string>> = {};
    for (const urlPath of pages) {
      await page.goto(urlPath);
      const origin = new URL(page.url()).origin;
      const tags = await page.locator("meta").evaluateAll((nodes) =>
        nodes.flatMap((node) => {
          const key = node.getAttribute("property") ?? node.getAttribute("name");
          const value = node.getAttribute("content");
          if (!key || value === null) return [];
          if (!key.startsWith("og:") && !key.startsWith("twitter:")) return [];
          return [[key, value] as const];
        }),
      );
      const record: Record<string, string> = {};
      for (const [key, value] of tags) record[key] = stored(value, origin);
      meta[urlPath] = record;
      expect(record["og:title"]?.length).toBeGreaterThan(0);
      expect(record["og:description"]?.length).toBeGreaterThan(0);
      expect(record["og:type"]).toBe("website");
      expect(record["og:locale"]).toBe(urlPath.startsWith("/ar") ? "ar_EG" : "en_US");
      expect(record["og:image"]?.endsWith("/share/nelo-share.png")).toBe(true);
      expect(record["og:image"]?.startsWith("<site>")).toBe(true);
      expect(record["og:image:width"]).toBe("1200");
      expect(record["og:image:height"]).toBe("630");
      expect(record["twitter:card"]).toBe("summary_large_image");
      const icons = await page.locator("link[rel='icon'], link[rel='apple-touch-icon']").evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("href") ?? ""),
      );
      expect(icons.some((href) => href.includes("/favicon.ico"))).toBe(true);
      expect(icons.some((href) => href.includes("/share/icon-512.png"))).toBe(true);
      expect(icons.some((href) => href.includes("/share/apple-icon-180.png"))).toBe(true);
    }
    fs.writeFileSync(path.join(evidenceDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

    await page.goto("/ar/operator/sign-in");
    await expect(page.locator("meta[property^='og:']")).toHaveCount(0);

    for (const asset of ["/favicon.ico", "/share/nelo-share.png", "/share/icon-512.png", "/share/apple-icon-180.png"]) {
      const response = await page.request.get(asset);
      expect(response.status(), asset).toBe(200);
      expect(response.headers()["content-type"], asset).toMatch(/^image\//);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ar/campaign-offers/SYN-003");
    const video = page.locator("video");
    await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.currentSrc)).toContain("#t=0.1");
    await video.evaluate(
      (node: HTMLVideoElement) =>
        new Promise<void>((resolve) => {
          if (node.readyState >= 2) {
            resolve();
            return;
          }
          node.addEventListener("loadeddata", () => resolve(), { once: true });
        }),
    );
    expect(await video.evaluate((node: HTMLVideoElement) => node.readyState)).toBeGreaterThanOrEqual(2);
    await page.screenshot({ path: path.join(evidenceDir, "campaign-offer-video-first-frame-ar-390.png") });

    const arabic = messagesFor("ar");
    await page.goto("/ar/campaign-offers/SYN-001");
    await page.locator("figure img").first().click();
    const dialog = page.locator("dialog");
    await expect(dialog.locator("img")).toBeVisible();
    await expect.poll(async () => (await dialog.locator("img").boundingBox())?.width ?? 0).toBeGreaterThan(200);
    await page.screenshot({ path: path.join(evidenceDir, "gallery-preview-ar-390.png") });
    await page.mouse.click(8, 8);
    await expect(dialog).toBeHidden();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/campaign-offers/SYN-001");
    await page.locator("figure img").first().click();
    await expect(page.locator("dialog img")).toBeVisible();
    await expect.poll(async () => (await page.locator("dialog img").boundingBox())?.width ?? 0).toBeGreaterThan(200);
    const box = await page.locator("dialog img").boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(63);
      expect(box.y).toBeGreaterThanOrEqual(23);
      expect(box.x + box.width).toBeLessThanOrEqual(1440 - 63);
      expect(box.y + box.height).toBeLessThanOrEqual(900 - 23);
    }
    await page.screenshot({ path: path.join(evidenceDir, "gallery-preview-en-1440.png") });
    await page.mouse.click(8, 8);
    await expect(page.locator("dialog")).toBeHidden();
    expect(arabic.a11y.closePreview.length).toBeGreaterThan(0);
  } finally {
    await setPublished(operator, false);
    await context.close();
  }
});
