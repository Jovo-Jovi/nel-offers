import { expect, test as spec } from "@playwright/test";
import { otherPng, tinyPng } from "./support/samples";

spec("contacts, card price, banner, publish and removal", async ({ page }) => {
  spec.setTimeout(180 * 1000);
  await page.goto("/en/operator/campaign-settings");
  await page.getByLabel("WhatsApp digits").fill("12");
  await page.getByRole("button", { name: "Save contacts" }).click();
  await expect(page.getByText("does not match the required pattern")).toBeVisible();

  await page.getByLabel("WhatsApp display text").fill("SYN WhatsApp");
  await page.getByLabel("WhatsApp digits").fill("200000000000");
  await page.getByLabel("Hotline display text").fill("SYN hotline");
  await page.getByLabel("Hotline dial string").fill("000");
  await page.getByLabel("NEL site URL").fill("https://example.invalid");
  await page.getByRole("button", { name: "Save contacts" }).click();
  await expect(page.getByRole("link", { name: "WhatsApp link" })).toHaveAttribute("href", /wa\.me\/200000000000/);
  await expect(page.getByRole("link", { name: "Call link" })).toHaveAttribute("href", "tel:000");
  await expect(page.getByRole("link", { name: "NEL site link" })).toHaveAttribute("href", "https://example.invalid");

  const card = page.getByRole("switch", { name: "Show the price on the home cards" });
  if ((await card.getAttribute("aria-checked")) !== "true") await card.click();
  await expect(card).toHaveAttribute("aria-checked", "true");
  await card.click();
  await expect(card).toHaveAttribute("aria-checked", "false");
  await card.click();
  await expect(card).toHaveAttribute("aria-checked", "true");

  const removeBannerButton = page.getByRole("button", { name: "Remove banner" });
  if ((await removeBannerButton.count()) > 0) {
    await removeBannerButton.click();
    await expect(page.getByRole("dialog")).toContainText("Remove the campaign banner?");
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText("No banner yet.")).toBeVisible();
  }

  async function sendBanner(bytes: Buffer, label: string) {
    await page.locator("#banner").setInputFiles({ name: "banner.png", mimeType: "image/png", buffer: bytes });
    await expect(page.getByAltText("Banner preview")).toBeVisible();
    await page.getByRole("button", { name: label }).click();
    await expect(page.locator("img[data-banner-key]")).toBeVisible({ timeout: 60 * 1000 });
  }

  await sendBanner(tinyPng, "Upload banner");
  const firstKey = await page.locator("img[data-banner-key]").getAttribute("data-banner-key");
  await sendBanner(otherPng, "Replace banner");
  const image = page.locator("img[data-banner-key]");
  await expect(image).not.toHaveAttribute("data-banner-key", firstKey ?? "");
  const secondKey = await image.getAttribute("data-banner-key");
  await page.reload();
  await expect(page.locator("img[data-banner-key]")).toHaveAttribute("data-banner-key", secondKey ?? "");

  await page.goto("/en/operator/overview");
  await page.getByRole("switch", { name: "Published" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(/Publish \d+ campaign offers/);
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("switch", { name: "Published" })).toHaveAttribute("aria-checked", "true");
  await expect.poll(async () => {
    const visible = await page.locator("[data-status='visible']").innerText();
    return Number(visible.match(/\d+/)?.[0] ?? "0");
  }).toBeGreaterThan(0);

  await page.getByRole("switch", { name: "Published" }).click();
  await expect(page.getByRole("dialog")).toContainText("coming-soon");
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("switch", { name: "Published" })).toHaveAttribute("aria-checked", "false");

  await page.goto("/en/operator/campaign-offers");
  await page.locator("tr[data-code='SYN-009']").getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("dialog")).toContainText("SYN-009");
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(page.locator("[data-code='SYN-009']")).toHaveCount(0);
});
