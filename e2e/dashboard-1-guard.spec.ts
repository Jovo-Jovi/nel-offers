import { expect, test as spec } from "@playwright/test";

spec("campaign offer codes stay synthetic", async ({ page }) => {
  await page.goto("/en/operator/campaign-offers");
  const codes = await page.locator("[data-code]").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-code") ?? ""),
  );
  for (const code of codes) expect(code.startsWith("SYN-")).toBe(true);
});
