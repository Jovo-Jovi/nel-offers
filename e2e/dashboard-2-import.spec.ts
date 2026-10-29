import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { saveShot } from "./support/shot";
import { expect, test as spec, type Page } from "@playwright/test";
import { workbookBytes, type Cell } from "./support/sheet";

const templateHash = ["23f88b52", "710d3bc2", "83086a95", "5ae405b0", "18165247", "afd05957", "39600cc4", "bcc18fa1"].join("");

function cairoDay() {
  const formatted = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [year, month, day] = formatted.split("-").map((part) => Number(part));
  return { year: year ?? 0, month: month ?? 1, day: day ?? 1 };
}

function shift(days: number) {
  const today = cairoDay();
  const date = new Date(Date.UTC(today.year, today.month - 1, today.day + days));
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

function line(code: string, index: number, price: number, start: string | null, end: string, conditions: boolean): Cell[] {
  const suffix = String(index).padStart(2, "0");
  return [
    code,
    `تحليل تجريبي ${suffix}`,
    `Synthetic analysis ${suffix}`,
    price,
    start,
    end,
    conditions ? "شرط تجريبي" : null,
    conditions ? "Synthetic condition" : null,
    index,
  ];
}

function section(page: Page, heading: string) {
  return page.locator("section").filter({ has: page.getByRole("heading", { name: heading }) });
}

async function removeSyntheticCampaignOffers(page: Page) {
  await page.goto("/en/operator/campaign-offers");
  for (;;) {
    const row = page.locator("[data-code]").first();
    if ((await row.count()) === 0) break;
    const code = (await row.getAttribute("data-code")) ?? "";
    expect(code.startsWith("SYN-")).toBe(true);
    await row.getByRole("button", { name: "More" }).click();
    await row.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText(code);
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
    await expect(page.locator(`[data-code="${code}"]`)).toHaveCount(0);
  }
}

const sheetType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

async function previewOf(page: Page) {
  return page.waitForResponse(
    (response) => response.url().includes("/api/operator/campaign-imports/preview") && response.request().method() === "POST",
  );
}

async function choose(page: Page, bytes: Buffer, name = "sheet.xlsx") {
  const preview = previewOf(page);
  await page.locator("#workbook").setInputFiles({
    name,
    mimeType: sheetType,
    buffer: bytes,
  });
  expect((await preview).ok()).toBeTruthy();
  await expect(page.locator("[data-sheet-name]")).toHaveText(name);
  await expect(page.locator("[data-byte-size]")).toHaveText(/\d/);
  await expect(page.locator("[data-preview-summary]")).toBeVisible();
}

async function dropSheet(page: Page, bytes: Buffer, name: string) {
  const preview = previewOf(page);
  await page.locator("[data-drop-zone]").evaluate(
    (zone, payload) => {
      const binary = new Uint8Array(payload.bytes);
      const held = new File([binary], payload.name, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const transfer = new DataTransfer();
      transfer.items.add(held);
      zone.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }));
      zone.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    },
    { bytes: Array.from(bytes), name },
  );
  expect((await preview).ok()).toBeTruthy();
  await expect(page.locator("[data-sheet-name]")).toHaveText(name);
  await expect(page.locator("[data-preview-summary]")).toBeVisible();
}

spec("import template, refusals, additions and a stale confirm", async ({ page }) => {
  spec.setTimeout(300 * 1000);
  await page.goto("/en/operator/import");
  const template = await page.request.get("/api/operator/campaign-template");
  expect(template.status()).toBe(200);
  expect(createHash("sha256").update(await template.body()).digest("hex")).toBe(templateHash);

  const end = shift(20);
  const refused = await workbookBytes([
    ["SYN-E1", "اسم", "a@b.co", 10, null, end, null, null, 1],
    ["SYN-E2", "01012345678", "Name", 10, null, end, null, null, 2],
    ["SYN-E3", "0100 123 4567", "Name", 10, null, end, null, null, 3],
    ["SYN-E4", "Name", "+201001234567", 10, null, end, null, null, 4],
    ["SYN-E5", "00201001234567", "Name", 10, null, end, null, null, 5],
    ["SYN-E6", "Name", "Name", 10, null, end, "12345678901234", "note", 6],
  ]);
  await choose(page, refused);
  await expect(page.getByText("belong in campaign settings")).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Confirm import" })).toBeDisabled();
  await removeSyntheticCampaignOffers(page);
  await page.goto("/en/operator/import");

  const rows = [
    line("SYN-001", 1, 100, null, shift(20), false),
    line("SYN-002", 2, 200, shift(-2), shift(20), false),
    line("SYN-003", 3, 300, null, shift(15), false),
    line("SYN-004", 4, 400, shift(7), shift(30), false),
    line("SYN-005", 5, 500, shift(-20), shift(-1), false),
    line("SYN-006", 6, 600, null, shift(12), true),
    line("SYN-009", 9, 900, null, shift(12), false),
  ];
  const valid = await workbookBytes(rows);
  await choose(page, valid);
  await expect(section(page, "Additions").locator("p").first()).toHaveText("7");
  await expect(section(page, "Updates").locator("p").first()).toHaveText("0");
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByRole("main").getByText("Added 7, updated 0, unchanged 0.")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export current" }).click(),
  ]);
  const exported = await download.path();
  expect(exported).toBeTruthy();
  const exportedPreview = previewOf(page);
  await page.locator("#workbook").setInputFiles(exported ?? "");
  expect((await exportedPreview).ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Errors" })).toHaveCount(0);
  await expect(section(page, "Additions").locator("p").first()).toHaveText("0");
  await expect(section(page, "Updates").locator("p").first()).toHaveText("0");
  await expect(page.getByText("Unchanged 7")).toBeVisible();

  const changed = await workbookBytes([line("SYN-001", 1, 150, null, shift(20), false)]);
  await choose(page, changed);
  const updates = section(page, "Updates");
  await expect(updates).toContainText("price_egp");
  await expect(updates).toContainText("100.00");
  await expect(updates).toContainText("150.00");

  const fresh = await page.request.post("/api/operator/campaign-imports/preview", {
    multipart: {
      workbook: {
        name: "sheet.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: changed,
      },
    },
  });
  expect(fresh.status()).toBe(200);
  const preview = (await fresh.json()) as {
    sheetSha256: string;
    expectedCount: number;
    expectedUpdatedAt: string | null;
  };
  const confirmed = await page.request.post("/api/operator/campaign-imports/confirm", {
    multipart: {
      workbook: {
        name: "sheet.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: changed,
      },
      sheetSha256: preview.sheetSha256,
      expectedCount: String(preview.expectedCount),
      expectedUpdatedAt: preview.expectedUpdatedAt ?? "",
    },
  });
  expect(confirmed.status()).toBe(200);
  await confirmed.json();
  const pending = page.waitForResponse((response) => response.url().includes("/api/operator/campaign-imports/confirm"));
  const started = Date.now();
  await page.getByRole("button", { name: "Confirm import" }).click();
  const answer = await pending;
  const elapsed = Date.now() - started;
  expect(answer.status()).toBe(409);
  expect(elapsed).toBeLessThan(5 * 1000);
  console.log(`stale-confirm ${elapsed}ms`);
  const uiBody = await answer.text();
  expect(uiBody, uiBody).toContain("changed-since-preview");
  await expect(page.getByRole("main").getByText("The campaign changed since this preview. Preview again.")).toBeVisible();
});

spec("chosen sheet, drop, error summary and a re-read", async ({ page }) => {
  spec.setTimeout(180 * 1000);
  const evidenceDir = path.join("docs", "evidence", "T05-F2");
  fs.mkdirSync(evidenceDir, { recursive: true });
  const end = shift(20);
  const current = await workbookBytes([
    line("SYN-001", 1, 150, null, end, false),
    line("SYN-002", 2, 200, shift(-2), shift(20), false),
    line("SYN-003", 3, 300, null, shift(15), false),
    line("SYN-004", 4, 400, shift(7), shift(30), false),
    line("SYN-005", 5, 500, shift(-20), shift(-1), false),
    line("SYN-006", 6, 600, null, shift(12), true),
    line("SYN-009", 9, 900, null, shift(12), false),
  ]);
  const posted: string[] = [];
  await page.route("**/api/operator/campaign-imports/preview", async (route) => {
    const raw = route.request().postDataBuffer();
    posted.push(raw ? raw.toString("latin1") : `empty:${route.request().postData() ?? ""}`);
    await route.continue();
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar/operator/import");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".nel-shimmer")).toHaveCount(0);
  await choose(page, current, "chosen-sheet.xlsx");
  const sizeText = (await page.locator("[data-byte-size]").innerText()).replace(/[\d\s.,\u0660-\u0669]/g, "");
  expect(sizeText.length).toBeGreaterThan(0);
  await expect(page.locator("[data-preview-summary]")).toBeVisible();
  await saveShot(page, path.join(evidenceDir, "import-selected-ar-390.png"));
  const joined = posted.join("\n");
  expect(joined.includes("sheet.xlsx"), joined.slice(0, 500)).toBe(true);
  expect(joined.includes("chosen-sheet.xlsx"), joined.slice(0, 500)).toBe(false);
  await dropSheet(page, current, "dropped.xlsx");
  await expect(page.locator("[data-byte-size]")).toHaveText(/\d/);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/operator/import");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".nel-shimmer")).toHaveCount(0);
  const broken = line("SYN-001", 1, 150, null, end, false);
  broken[1] = "";
  await choose(page, await workbookBytes([broken]), "broken.xlsx");
  await expect(page.locator("[data-preview-summary]")).toContainText("fix them in Excel, then choose the sheet again.");
  await expect(page.getByRole("columnheader", { name: "Row · Column" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm import" })).toBeDisabled();
  await saveShot(page, path.join(evidenceDir, "import-errors-en-1440.png"), true);
  const before = await page.locator("[data-preview-summary]").innerText();
  await choose(page, await workbookBytes([line("SYN-001", 1, 150, null, end, false)]), "edited.xlsx");
  await expect(page.locator("[data-preview-summary]")).not.toHaveText(before);
});

spec("a failed preview shows the toast, and the error words in both locales", async ({ page }) => {
  await page.route("**/api/operator/campaign-imports/preview", (route) =>
    route.fulfill({ status: 500, contentType: "text/html", body: "<html><body>nope</body></html>" }),
  );
  await page.goto("/en/operator/import");
  await page.locator("#workbook").setInputFiles({
    name: "broken.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("not-a-workbook"),
  });
  await expect(page.locator(".nel-toast")).toContainText("That did not work.");
  await expect(page.locator(".animate-spin")).toHaveCount(0);
  await expect(page.locator("#workbook")).toBeEnabled();
  await expect(page.getByText("Choose another")).toBeVisible();
  await page.unroute("**/api/operator/campaign-imports/preview");

  const end = shift(20);
  const broken = line("SYN-001", 1, 150, null, end, false);
  broken[1] = "";
  await page.goto("/ar/operator/import");
  await choose(page, await workbookBytes([broken]), "broken-ar.xlsx");
  await expect(page.locator("[data-preview-summary]")).toContainText("الأخطاء:");
  await expect(page.getByRole("columnheader", { name: "الصف · العمود" })).toBeVisible();
});
