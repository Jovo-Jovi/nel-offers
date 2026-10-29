import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

export async function saveShot(page: Page, shotPath: string, fullPage = false) {
  await page.waitForFunction(() => document.getAnimations().length === 0);
  fs.mkdirSync(path.dirname(shotPath), { recursive: true });
  await page.screenshot({ path: shotPath, fullPage });
}
