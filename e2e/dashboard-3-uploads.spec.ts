import { expect, test as spec, type Page } from "@playwright/test";
import { cleanMp4, locatedMp4, tinyPng } from "./support/samples";

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

spec("media queue, refusals, replacement and a repeated finalise", async ({ page }) => {
  spec.setTimeout(240 * 1000);
  await page.goto("/en/operator/media-objects");
  await page.getByRole("tab", { name: "Images" }).click();
  const huge = Buffer.alloc(15 * 1024 * 1024 + 1, 7);
  await page.locator("#uploads-images").setInputFiles([
    { name: "SYN-001.png", mimeType: "image/png", buffer: tinyPng },
    { name: "SYN-001-1.png", mimeType: "image/png", buffer: tinyPng },
    { name: "UNKNOWN.png", mimeType: "image/png", buffer: tinyPng },
    { name: "SYN-004.png", mimeType: "image/png", buffer: huge },
  ]);
  await expect(page.getByText("Choose a campaign offer and a slot.")).toBeVisible();
  await expect(page.getByText("larger than 15 MB")).toBeVisible();
  await page.getByRole("tab", { name: "Videos" }).click();
  await page.locator("#uploads-videos").setInputFiles([
    { name: "SYN-002.mp4", mimeType: "video/mp4", buffer: cleanMp4() },
    { name: "SYN-002-1.mp4", mimeType: "video/mp4", buffer: cleanMp4() },
    { name: "SYN-003.mp4", mimeType: "video/mp4", buffer: locatedMp4() },
  ]);
  await expect(page.getByText("A video cannot use an image suffix (-1 to -3).")).toBeVisible();
  await expect(page.getByText("Export the video without location")).toBeVisible();
  await upload(page);
  await expect(page.locator("[data-upload='done']")).toHaveCount(3, { timeout: 180 * 1000 });

  await page.getByRole("tab", { name: "Images" }).click();
  await page.locator("#uploads-images").setInputFiles({ name: "SYN-001.png", mimeType: "image/png", buffer: tinyPng });
  await expect(page.getByText("Replaces").first()).toBeVisible();
  await upload(page);
  await expect(page.locator("[data-upload='done']")).toHaveCount(4, { timeout: 120 * 1000 });

  const webp = Buffer.from("RIFF");
  const named = await page.request.post("/api/operator/media-objects/presign", {
    data: { name: "SYN-005.png", type: "image/webp", size: webp.length },
  });
  expect(named.status()).toBe(422);
  const presign = await page.request.post("/api/operator/media-objects/presign", {
    data: { code: "SYN-005", slot: "main_image", type: "image/webp", size: webp.length },
  });
  expect(presign.status()).toBe(200);
  const signed = (await presign.json()) as { objectKey: string; uploadUrl: string; code: string; slot: string };
  const put = await page.request.fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "content-type": "image/webp" },
    data: webp,
  });
  expect(put.status()).toBe(200);
  const first = await page.request.post("/api/operator/media-objects/finalise", {
    data: { objectKey: signed.objectKey, code: signed.code, slot: signed.slot },
  });
  expect(first.status()).toBe(200);
  const second = await page.request.post("/api/operator/media-objects/finalise", {
    data: { objectKey: signed.objectKey, code: signed.code, slot: signed.slot },
  });
  expect(second.status()).toBe(409);
  expect(((await second.json()) as { code: string }).code).toBe("already-recorded");
});
