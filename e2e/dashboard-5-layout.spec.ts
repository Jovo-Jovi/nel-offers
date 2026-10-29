import fs from "node:fs";
import path from "node:path";
import { expect, test as spec, type BrowserContext, type Page } from "@playwright/test";

const pages = [
  { name: "overview", segment: "overview", signed: true },
  { name: "campaign-offers", segment: "campaign-offers", signed: true },
  { name: "import", segment: "import", signed: true },
  { name: "media-objects", segment: "media-objects", signed: true },
  { name: "campaign-settings", segment: "campaign-settings", signed: true },
  { name: "sign-in", segment: "sign-in", signed: false },
] as const;

const widths = [320, 390, 768, 1024, 1440];

function pathFor(locale: "ar" | "en", segment: string) {
  return `/${locale}/operator/${segment}`;
}

async function measure(page: Page, urlPath: string, width: number, shot: string | null) {
  const served = await page.request.get(urlPath);
  const html = await served.text();
  expect(html.includes("style=")).toBe(false);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.goto(urlPath, { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toBeVisible();
  if (urlPath.endsWith("/sign-in")) {
    await expect(page.locator("input[name=email]")).toBeVisible();
    await expect(page.locator("input[name=password]")).toBeVisible();
  }
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  expect(fits).toBe(true);
  if (shot) {
    fs.mkdirSync(path.join("docs", "evidence", "T04-F2"), { recursive: true });
    await page.screenshot({ path: shot });
  }
}

spec("dashboard layout in both locales", async ({ browser }) => {
  spec.setTimeout(300 * 1000);
  const signed = await browser.newContext({ storageState: "e2e/.auth/operator.json" });
  const anon = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  try {
    for (const locale of ["ar", "en"] as const) {
      for (const entry of pages) {
        const context: BrowserContext = entry.signed ? signed : anon;
        const page = await context.newPage();
        const violations: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error" && /content security policy/i.test(message.text())) violations.push("csp");
        });
        for (const width of widths) {
          const shot =
            locale === "ar" && entry.name === "overview" && width === 390
              ? path.join("docs", "evidence", "T04-F2", "overview-ar-390.png")
              : null;
          await measure(page, pathFor(locale, entry.segment), width, shot);
        }
        expect(violations).toEqual([]);
        await page.close();
      }
    }
  } finally {
    await signed.close();
    await anon.close();
  }
});
