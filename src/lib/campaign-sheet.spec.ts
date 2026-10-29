import { readFileSync as readBytes } from "node:fs";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { diffCampaignRows, type StoredCampaignOffer } from "./campaign-sheet-diff";
import { buildCampaignExport } from "./campaign-export";
import { readCampaignSheet, type NormalisedRow } from "./campaign-sheet";
import {
  calendarStamp,
  conditionLimit,
  dateFloor,
  firstDataRow,
  headers,
  lastDataRow,
  maxSheetRows,
  nameLimit,
  priceWholeLimit,
  sheetName,
} from "./sheet-format";

const indic = "٠١٢٣٤٥٦٧٨٩";
const westernDigits = ["0123", "456", "789"].join("");

function toIndic(ascii: string) {
  return Array.from(ascii, (char) => {
    const index = westernDigits.indexOf(char);
    return index >= 0 ? (indic[index] ?? char) : char;
  }).join("");
}

function joinParts(parts: readonly string[]) {
  return parts.join("");
}

function later(days: number) {
  return calendarStamp(dateFloor.year, dateFloor.month, dateFloor.day + days);
}

function utcDate(iso: string) {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

async function buildSheet(fill: (sheet: ExcelJS.Worksheet) => void, name = sheetName) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(name);
  if (name === sheetName) {
    headers.forEach((header, index) => {
      sheet.getCell(1, index + 1).value = header;
    });
  }
  fill(sheet);
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

function put(sheet: ExcelJS.Worksheet, rowNumber: number, values: readonly ExcelJS.CellValue[]) {
  values.forEach((value, index) => {
    if (value !== null && value !== undefined) sheet.getCell(rowNumber, index + 1).value = value;
  });
}

function base(code: string, end = later(10)): ExcelJS.CellValue[] {
  return [code, "اسم", "Name", 100, null, end, null, null, 1];
}

function kinds(errors: { kind: string }[]) {
  return errors.map((error) => error.kind);
}

describe("readCampaignSheet", () => {
  it("refuses a workbook whose sheet name is not the template name", async () => {
    const bytes = await buildSheet(() => undefined, "Notes");
    const parsed = await readCampaignSheet(bytes);
    expect(kinds(parsed.errors)).toEqual(["wrong-sheet"]);
    expect(parsed.rows).toEqual([]);
  });

  it("refuses a header that does not match, as one error", async () => {
    const bytes = await buildSheet((sheet) => {
      sheet.getCell(1, 1).value = "codes";
    });
    const parsed = await readCampaignSheet(bytes);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]?.kind).toBe("wrong-header");
  });

  it("reports each cell error kind", async () => {
    const bytes = await buildSheet((sheet) => {
      put(sheet, 2, ["", "اسم", "Name", 100, null, later(4), null, null, 1]);
      put(sheet, 3, ["!", "اسم", "Name", 100, null, later(4), null, null, 1]);
      put(sheet, 4, ["AB", "", "Name", 100, null, later(4), null, null, 1]);
      put(sheet, 5, ["AC", "س".repeat(nameLimit + 1), "Name", 100, null, later(4), null, null, 1]);
      put(sheet, 6, ["AD", "اسم", "Name", -1, null, later(4), null, null, 1]);
      put(sheet, 7, ["AE", "اسم", "Name", 1.234, null, later(4), null, null, 1]);
      put(sheet, 8, ["AF", "اسم", "Name", 10 ** priceWholeLimit, null, later(4), null, null, 1]);
      put(sheet, 9, ["AG", "اسم", "Name", "notes", null, later(4), null, null, 1]);
      put(sheet, 10, ["AH", "اسم", "Name", 100, null, "tomorrow", null, null, 1]);
      put(sheet, 11, ["AI", "اسم", "Name", 100, null, new Date(Date.UTC(dateFloor.year, dateFloor.month, dateFloor.day, 1, 2)), null, null, 1]);
      put(sheet, 12, ["AJ", "اسم", "Name", 100, null, later(0), null, null, 1]);
      put(sheet, 13, ["AK", "اسم", "Name", 100, later(12), later(4), null, null, 1]);
      put(sheet, 14, ["AL", "اسم", "Name", 100, null, later(4), "فقط", null, 1]);
      put(sheet, 15, ["AM", "اسم", "Name", 100, null, later(4), null, null, 1.5]);
      put(sheet, 16, ["AN", "اسم", "Name", { formula: "1+1", result: 2 }, null, later(4), null, null, 1]);
      put(sheet, 17, ["AO", "اسم", "Name", { error: "#N/A" }, null, later(4), null, null, 1]);
    });
    const parsed = await readCampaignSheet(bytes);
    expect(kinds(parsed.errors)).toEqual([
      "empty",
      "pattern",
      "empty",
      "too-long",
      "negative",
      "decimals",
      "price-range",
      "pattern",
      "not-a-date",
      "time-part",
      "date-floor",
      "start-after-end",
      "one-condition",
      "not-whole",
      "formula",
      "error-cell",
    ]);
  });

  it("refuses an email, a mobile in each written form, and a 14-digit run", async () => {
    const plain = joinParts(["010", "1234", "5678"]);
    const spaced = joinParts(["010", " ", "1234", " ", "5678"]);
    const plus = joinParts(["+20", "10", "1234", "5678"]);
    const zeros = joinParts(["0020", "10", "1234", "5678"]);
    const national = joinParts(["12", "3456", "7890", "1234"]);
    const bytes = await buildSheet((sheet) => {
      put(sheet, 2, ["BA", "اسم", "lab@example.invalid", 100, null, later(4), null, null, 1]);
      put(sheet, 3, ["BB", plain, "Name", 100, null, later(4), null, null, 1]);
      put(sheet, 4, ["BC", "اسم", spaced, 100, null, later(4), null, null, 1]);
      put(sheet, 5, ["BD", "اسم", plus, 100, null, later(4), null, null, 1]);
      put(sheet, 6, ["BE", zeros, "Name", 100, null, later(4), null, null, 1]);
      put(sheet, 7, ["BF", national, "Name", 100, null, later(4), null, null, 1]);
    });
    const parsed = await readCampaignSheet(bytes);
    expect(kinds(parsed.errors)).toEqual(["email", "mobile", "mobile", "mobile", "mobile", "national-id"]);
    expect(parsed.rows).toEqual([]);
  });

  it("reads Arabic-Indic digits, a date cell, and a text date", async () => {
    const iso = later(6);
    const bytes = await buildSheet((sheet) => {
      put(sheet, 2, ["CA", "اسم", "Name", toIndic("100.50"), null, toIndic(iso), null, null, toIndic("4")]);
      put(sheet, 3, ["CB", { richText: [{ text: "اسم" }] }, { text: "Name", hyperlink: "https://example.invalid/a" }, 80, null, utcDate(later(8)), null, null, 2]);
    });
    const parsed = await readCampaignSheet(bytes);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({ code: "CA", price_egp: "100.50", ends_on: iso, display_order: 4 });
    expect(parsed.rows[1]).toMatchObject({
      code: "CB",
      name_ar: "اسم",
      name_en: "Name",
      price_egp: "80.00",
      ends_on: later(8),
      display_order: 2,
    });
  });

  it("skips blank rows and flags a value past the last column and the last row", async () => {
    const bytes = await buildSheet((sheet) => {
      put(sheet, 2, base("DA"));
      put(sheet, 4, base("DB"));
      sheet.getCell(4, headers.length + 1).value = "x";
      sheet.getCell(lastDataRow + 1, 1).value = "y";
    });
    const parsed = await readCampaignSheet(bytes);
    expect(parsed.rows.map((row) => row.code)).toEqual(["DA"]);
    expect(kinds(parsed.errors)).toEqual(["extra-cell", "extra-cell"]);
  });

  it("flags codes that differ only by case", async () => {
    const bytes = await buildSheet((sheet) => {
      put(sheet, 2, base("ab"));
      put(sheet, 3, base("AB"));
    });
    const parsed = await readCampaignSheet(bytes);
    expect(parsed.rows).toEqual([]);
    expect(kinds(parsed.errors)).toEqual(["duplicate-code", "duplicate-code"]);
  });

  it("accepts the maximum number of data rows", async () => {
    const bytes = await buildSheet((sheet) => {
      for (let index = 0; index < maxSheetRows; index += 1) {
        put(sheet, firstDataRow + index, base(`C${index}`, later(3)));
      }
    });
    const parsed = await readCampaignSheet(bytes);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(maxSheetRows);
    expect(parsed.rows[0]?.sheet_row).toBe(firstDataRow);
    expect(parsed.rows[maxSheetRows - 1]?.sheet_row).toBe(lastDataRow);
  });

  it("accepts a price at the top of the column and a text time", async () => {
    const top = `${"9".repeat(priceWholeLimit)}.99`;
    const bytes = await buildSheet((sheet) => {
      put(sheet, 2, ["EA", "اسم", "Name", top, null, later(2), null, null, null]);
      put(sheet, 3, ["EB", "اسم", "Name", 100, null, `${later(2)} 01:02`, null, null, null]);
      put(sheet, 4, ["EC", "اسم", "Name", `${"9".repeat(priceWholeLimit + 1)}.00`, null, later(2), "أ", "ب".repeat(conditionLimit + 1), 0]);
    });
    const parsed = await readCampaignSheet(bytes);
    expect(parsed.rows.map((row) => row.price_egp)).toEqual([top]);
    expect(kinds(parsed.errors)).toEqual(["time-part", "price-range", "too-long"]);
  });
});

describe("diffCampaignRows", () => {
  const incoming: NormalisedRow = {
    sheet_row: 2,
    code: "AB",
    name_ar: "اسم",
    name_en: "Name",
    price_egp: "100.00",
    starts_on: null,
    ends_on: later(4),
    conditions_ar: null,
    conditions_en: null,
    display_order: 1,
  };

  function stored(overrides: Partial<StoredCampaignOffer> = {}): StoredCampaignOffer {
    return {
      code_key: "AB",
      code: "AB",
      name_ar: "اسم",
      name_en: "Name",
      price_egp: "100.00",
      starts_on: null,
      ends_on: later(4),
      conditions_ar: null,
      conditions_en: null,
      display_order: 1,
      ...overrides,
    };
  }

  it("lists an addition, an update of every changed field, and an unchanged row", () => {
    const second: NormalisedRow = { ...incoming, sheet_row: 3, code: "CD", price_egp: "80.00" };
    const changed: NormalisedRow = {
      ...incoming,
      code: "ab",
      name_ar: "آخر",
      name_en: "Other",
      price_egp: "90.00",
      starts_on: later(1),
      ends_on: later(5),
      conditions_ar: "شرط",
      conditions_en: "Terms",
      display_order: 2,
    };
    const diff = diffCampaignRows([changed, second], [stored()]);
    expect(diff.additions.map((row) => row.code)).toEqual(["CD"]);
    expect(diff.unchangedCount).toBe(0);
    expect(diff.updates).toHaveLength(1);
    expect(diff.updates[0]?.changes.map((change) => change.field)).toEqual([
      "code",
      "name_ar",
      "name_en",
      "price_egp",
      "starts_on",
      "ends_on",
      "conditions_ar",
      "conditions_en",
      "display_order",
    ]);
    const price = diff.updates[0]?.changes.find((change) => change.field === "price_egp");
    expect(price).toEqual({ field: "price_egp", previous: "100.00", next: "90.00" });
    const same = diffCampaignRows([incoming], [stored({ price_egp: "100.0000" })]);
    expect(same).toEqual({ additions: [], updates: [], unchangedCount: 1 });
  });
});

describe("campaign export round trip", () => {
  it("parses an export back to the same rows and an empty diff", async () => {
    const rows: NormalisedRow[] = [
      {
        sheet_row: 2,
        code: "RA",
        name_ar: "اسم",
        name_en: "Name",
        price_egp: "100.00",
        starts_on: later(1),
        ends_on: later(9),
        conditions_ar: "شرط",
        conditions_en: "Terms",
        display_order: 1,
      },
      {
        sheet_row: 3,
        code: "RB",
        name_ar: "ثان",
        name_en: "Second",
        price_egp: "80.00",
        starts_on: null,
        ends_on: later(6),
        conditions_ar: null,
        conditions_en: null,
        display_order: null,
      },
    ];
    const template = new Uint8Array(readBytes("assets/templates/NELO_offers_template.xlsx"));
    const exported = await buildCampaignExport(template, rows);
    const parsed = await readCampaignSheet(exported);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual(rows);
    const stored = parsed.rows.map((row) => ({ ...row, code_key: row.code.toUpperCase() }));
    expect(diffCampaignRows(parsed.rows, stored)).toEqual({
      additions: [],
      updates: [],
      unchangedCount: rows.length,
    });
  });
});
