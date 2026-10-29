import { expect, test as spec } from "@playwright/test";

function nonceFrom(policy: string | undefined) {
  const match = policy?.match(/'nonce-([^']+)'/);
  return match?.[1] ?? "";
}

spec("overview redirects to sign-in in both locales", async ({ page }) => {
  const arabic = await page.goto("/operator/overview");
  expect(new URL(page.url()).pathname).toBe("/operator/sign-in");
  expect(arabic?.status()).toBe(200);
  const english = await page.goto("/en/operator/overview");
  expect(new URL(page.url()).pathname).toBe("/en/operator/sign-in");
  expect(english?.status()).toBe(200);
});

spec("anonymous operator routes answer 401", async ({ request }) => {
  const posts = [
    "/api/operator/media-objects/presign",
    "/api/operator/media-objects/finalise",
    "/api/operator/campaign-imports/preview",
    "/api/operator/campaign-imports/confirm",
    "/api/operator/campaign-banner/presign",
    "/api/operator/campaign-banner/finalise",
  ];
  for (const urlPath of posts) {
    const response = await request.post(urlPath, { data: {} });
    expect(response.status()).toBe(401);
  }
  const gets = ["/api/operator/campaign-template", "/api/operator/campaign-export"];
  for (const urlPath of gets) {
    const response = await request.get(urlPath);
    expect(response.status()).toBe(401);
  }
});

spec("sign-in pages set language and direction", async ({ page }) => {
  await page.goto("/operator/sign-in");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.goto("/en/operator/sign-in");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

spec("public pages set no cookies and report no policy violation", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /content security policy/i.test(message.text())) {
      violations.push("csp");
    }
  });
  const home = await page.goto("/");
  expect(home?.status()).toBe(200);
  expect(await page.context().cookies()).toEqual([]);
  expect(home?.headers()["set-cookie"]).toBeUndefined();
  const english = await page.goto("/en");
  expect(english?.status()).toBe(200);
  expect(await page.context().cookies()).toEqual([]);
  expect(english?.headers()["set-cookie"]).toBeUndefined();
  expect(violations).toEqual([]);
});

spec("each visit receives a different nonce", async ({ request }) => {
  const first = await request.get("/");
  const second = await request.get("/");
  const nonceA = nonceFrom(first.headers()["content-security-policy"]);
  const nonceB = nonceFrom(second.headers()["content-security-policy"]);
  expect(nonceA.length).toBeGreaterThan(0);
  expect(nonceB.length).toBeGreaterThan(0);
  expect(nonceA).not.toBe(nonceB);
});
