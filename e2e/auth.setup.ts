import fs from "node:fs";
import path from "node:path";
import { expect, test as spec, type Page } from "@playwright/test";
import { currentCode, windowRemain } from "./support/totp";

async function submitCode(page: Page, secret: string) {
  const remain = windowRemain();
  if (remain < 5) await page.waitForTimeout((remain + 1) * 1000);
  await page.getByLabel("Code").fill(currentCode(secret));
  await page.getByRole("button", { name: "Verify" }).click();
}

spec("operator session", async ({ page }) => {
  const email = process.env.E2E_OPERATOR_EMAIL ?? "";
  const password = process.env.E2E_OPERATOR_PASSWORD ?? "";
  const secret = process.env.E2E_OPERATOR_TOTP_SECRET ?? "";
  expect(email.length).toBeGreaterThan(0);
  expect(password.length).toBeGreaterThan(0);
  expect(secret.length).toBeGreaterThan(0);
  await page.goto("/en/operator/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/operator/totp");
  await submitCode(page, secret);
  try {
    await page.waitForURL("**/operator/overview", { timeout: 15 * 1000 });
  } catch {
    const remain = windowRemain();
    await page.waitForTimeout((remain + 1) * 1000);
    await submitCode(page, secret);
    await page.waitForURL("**/operator/overview", { timeout: 15 * 1000 });
  }
  fs.mkdirSync(path.join("e2e", ".auth"), { recursive: true });
  await page.context().storageState({ path: path.join("e2e", ".auth", "operator.json") });
});
