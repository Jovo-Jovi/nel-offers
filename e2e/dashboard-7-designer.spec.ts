import fs from "node:fs";
import path from "node:path";
import { expect, test as spec, type Page } from "@playwright/test";
import { operatorPath, type Locale } from "../src/i18n/config";
import { formatCount } from "../src/lib/format-values";

const evidence = path.join("docs", "evidence", "T06");

const tileNames = {
  ar: ["الفيديو الرئيسي", "الصورة الرئيسية", "صورة 1", "صورة 2", "صورة 3"],
  en: ["Main video", "Main image", "Image 1", "Image 2", "Image 3"],
} as const;

async function shot(page: Page, name: string) {
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".nel-shimmer")).toHaveCount(0);
  fs.mkdirSync(evidence, { recursive: true });
  await page.screenshot({ path: path.join(evidence, name) });
}

async function switchSize(page: Page) {
  return page.locator(".nel-switch").first().evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
}

async function errorColour(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--color-error)";
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  });
}

spec("card v3, red removals, centred dialogs and the library", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const publish = await page.goto(operatorPath("ar", "overview"));
  expect(publish?.ok()).toBeTruthy();
  await shot(page, "dashboard-overview-ar-390.png");
  const published = await switchSize(page);

  for (const locale of ["ar", "en"] as const) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
      await page.goto(operatorPath(locale as Locale, "campaign-offers"));
      await expect(page.locator("h1")).toBeVisible();
      const card = page.locator("[data-code='SYN-001']");
      await expect(card).toBeVisible();
      const tiles = card.locator("[data-tile]");
      await expect(tiles).toHaveCount(5);
      const boxes = await tiles.evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          return { top: box.top, width: box.width };
        }),
      );
      for (const box of boxes) {
        expect(Math.abs(box.top - boxes[0].top)).toBeLessThanOrEqual(2);
        expect(Math.abs(box.width - boxes[0].width)).toBeLessThanOrEqual(1);
      }
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(fits).toBe(true);
      for (const name of tileNames[locale]) await expect(card.getByText(name, { exact: true })).toBeVisible();
      await expect(page.getByText(locale === "ar" ? "معرض" : "Gallery")).toHaveCount(0);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar/operator/campaign-offers");
  const filled = page.locator("[data-code='SYN-001'] [data-filled='yes']").first();
  await expect(filled.locator("img, video")).toHaveCount(1);
  const replace = filled.getByRole("link", { name: "استبدال" });
  await replace.focus();
  await expect(replace).toBeFocused();
  const slotRemove = filled.locator("[data-remove]");
  await slotRemove.focus();
  await expect(slotRemove).toBeFocused();
  const empty = page.locator("[data-filled='no'] a").first();
  await expect(empty).toHaveAttribute("href", /\?code=/);
  await expect(empty).toHaveAttribute("href", /&slot=/);
  await shot(page, "dashboard-campaign-offers-ar-390.png");

  const show = await page.locator("[data-code='SYN-001'] .nel-switch").evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
  expect(Math.abs(show.width - published.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(show.height - published.height)).toBeLessThanOrEqual(1);

  const colour = await errorColour(page);
  const removes = page.locator("[data-remove]");
  expect(await removes.count()).toBeGreaterThan(0);
  for (let index = 0; index < (await removes.count()); index += 1) {
    expect(await removes.nth(index).evaluate((node) => getComputedStyle(node).color)).toBe(colour);
  }

  await page.locator("[data-code='SYN-001']").getByRole("button", { name: "المزيد" }).click();
  const menuRemove = page.locator("[data-code='SYN-001']").getByRole("button", { name: "حذف", exact: true });
  expect(await menuRemove.evaluate((node) => getComputedStyle(node).color)).toBe(colour);
  await menuRemove.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await shot(page, "confirm-remove-ar-390.png");
  const centre = await dialog.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return {
      x: box.x + box.width / 2 - window.innerWidth / 2,
      y: box.y + box.height / 2 - window.innerHeight / 2,
    };
  });
  expect(Math.abs(centre.x)).toBeLessThanOrEqual(4);
  expect(Math.abs(centre.y)).toBeLessThanOrEqual(4);
  await dialog.getByRole("button", { name: "إلغاء" }).click();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/operator/campaign-offers");
  await shot(page, "dashboard-campaign-offers-en-1440.png");
  await page.locator("[data-code='SYN-001']").getByRole("button", { name: "More" }).click();
  await page.locator("[data-code='SYN-001']").getByRole("button", { name: "Remove", exact: true }).click();
  const wide = page.getByRole("dialog");
  const wideCentre = await wide.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return {
      x: box.x + box.width / 2 - window.innerWidth / 2,
      y: box.y + box.height / 2 - window.innerHeight / 2,
    };
  });
  expect(Math.abs(wideCentre.x)).toBeLessThanOrEqual(4);
  expect(Math.abs(wideCentre.y)).toBeLessThanOrEqual(4);
  await wide.getByRole("button", { name: "Cancel" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar/operator/media-objects");
  await page.getByRole("tab", { name: "فيديو", exact: true }).click();
  const rows = page.locator("[data-library]");
  const rowCount = await rows.count();
  for (let index = 0; index < rowCount; index += 1) {
    await expect(rows.nth(index)).toHaveAttribute("data-library", /:main_video$/);
  }
  const heading = page.getByRole("heading", { level: 2, name: /المكتبة/ });
  await expect(heading).toContainText(formatCount("ar", rowCount));
  await shot(page, "dashboard-media-objects-videos-ar-390.png");
  await page.getByRole("tab", { name: "صور", exact: true }).click();
  const images = page.locator("[data-library]");
  const imageCount = await images.count();
  for (let index = 0; index < imageCount; index += 1) {
    await expect(images.nth(index)).not.toHaveAttribute("data-library", /:main_video$/);
  }
  await expect(page.getByRole("heading", { level: 2, name: /المكتبة/ })).toContainText(formatCount("ar", imageCount));

  await page.goto("/ar/operator/campaign-settings");
  const settingsRemoves = page.locator("[data-remove]");
  const settingsColour = await errorColour(page);
  for (let index = 0; index < (await settingsRemoves.count()); index += 1) {
    expect(await settingsRemoves.nth(index).evaluate((node) => getComputedStyle(node).color)).toBe(settingsColour);
  }
  const settingsSwitch = await switchSize(page);
  expect(Math.abs(settingsSwitch.width - published.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(settingsSwitch.height - published.height)).toBeLessThanOrEqual(1);
});
