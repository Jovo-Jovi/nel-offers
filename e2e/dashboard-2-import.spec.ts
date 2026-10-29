import { createHash } from "node:crypto";
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

async function choose(page: Page, bytes: Buffer) {
  await page.locator("#workbook").setInputFiles({
    name: "sheet.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: bytes,
  });
  await expect(page.getByRole("button", { name: "Preview" })).toBeEnabled();
}

spec("import template, refusals, additions and a stale confirm", async ({ page }) => {
  spec.setTimeout(180 * 1000);
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
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByText("belong in campaign settings")).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Confirm import" })).toBeDisabled();

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
  await page.getByRole("button", { name: "Preview" }).click();
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
  await page.locator("#workbook").setInputFiles(exported ?? "");
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByRole("heading", { name: "Errors" })).toHaveCount(0);
  await expect(section(page, "Additions").locator("p").first()).toHaveText("0");
  await expect(section(page, "Updates").locator("p").first()).toHaveText("0");
  await expect(page.getByText("Unchanged 7")).toBeVisible();

  const changed = await workbookBytes([line("SYN-001", 1, 150, null, shift(20), false)]);
  await choose(page, changed);
  await page.getByRole("button", { name: "Preview" }).click();
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
  await page.getByRole("button", { name: "Confirm import" }).click();
  const answer = await pending;
  const uiBody = await answer.text();
  expect(uiBody, uiBody).toContain("changed-since-preview");
  await expect(page.getByRole("main").getByText("Preview again")).toBeVisible();
});
