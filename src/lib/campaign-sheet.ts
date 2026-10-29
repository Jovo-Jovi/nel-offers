import type ExcelJS from "exceljs";
import {
  calendarStamp,
  codePattern,
  conditionLimit,
  dateFloor,
  displayOrderLimit,
  firstDataRow,
  headers,
  lastDataRow,
  nameLimit,
  priceScale,
  priceWholeLimit,
  sheetName,
  twoDecimals,
} from "@/lib/sheet-format";
import { loadWorkbook } from "@/lib/workbook-bytes";

export const errorKinds = [
  "wrong-sheet",
  "wrong-header",
  "extra-cell",
  "empty",
  "pattern",
  "duplicate-code",
  "too-long",
  "negative",
  "decimals",
  "price-range",
  "not-a-date",
  "time-part",
  "date-floor",
  "start-after-end",
  "one-condition",
  "not-whole",
  "formula",
  "error-cell",
  "email",
  "mobile",
  "national-id",
  "no-rows",
] as const;

export type ErrorKind = (typeof errorKinds)[number];

export type SheetError = {
  row: number;
  column: string;
  cell: string;
  kind: ErrorKind;
};

export type NormalisedRow = {
  sheet_row: number;
  code: string;
  name_ar: string;
  name_en: string;
  price_egp: string;
  starts_on: string | null;
  ends_on: string;
  conditions_ar: string | null;
  conditions_en: string | null;
  display_order: number | null;
};

export type SheetWarning = {
  row: number;
  kind: "ended" | "not-visible" | "published";
};

const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
const persianIndic = "۰۱۲۳۴۵۶۷۸۹";

function westernDigits(value: string) {
  let out = "";
  for (const char of value) {
    const arabic = arabicIndic.indexOf(char);
    const persian = persianIndic.indexOf(char);
    if (arabic >= 0) out += String(arabic);
    else if (persian >= 0) out += String(persian);
    else out += char;
  }
  return out;
}

function columnLabel(index: number) {
  if (index >= 1 && index <= headers.length) return headers[index - 1] ?? "";
  let label = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    current = Math.floor((current - 1) / 26);
  }
  return label;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function rawText(cell: ExcelJS.Cell) {
  if (typeof cell.text === "string" && cell.text.length > 0) return cell.text;
  const value = cell.value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

type ReadCell =
  | { empty: true; raw: string }
  | { bad: "formula" | "error-cell"; raw: string }
  | { text: string; raw: string }
  | { number: number; raw: string }
  | { date: Date; raw: string };

function readCell(cell: ExcelJS.Cell): ReadCell {
  const raw = rawText(cell);
  const value = cell.value;
  if (value === null || value === undefined) return { empty: true, raw };
  if (typeof value === "string") {
    const text = value.trim();
    return text.length === 0 ? { empty: true, raw } : { text, raw };
  }
  if (typeof value === "number") return { number: value, raw: raw || String(value) };
  if (typeof value === "boolean") return { bad: "error-cell", raw };
  if (value instanceof Date) return { date: value, raw: raw || calendarFromDate(value).stamp };
  if (isRecord(value)) {
    if ("formula" in value || "sharedFormula" in value) return { bad: "formula", raw };
    if ("error" in value) return { bad: "error-cell", raw: raw || String(value.error ?? "") };
    if (Array.isArray(value.richText)) {
      const text = value.richText
        .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
        .join("")
        .trim();
      return text.length === 0 ? { empty: true, raw } : { text, raw: raw || text };
    }
    if (typeof value.text === "string") {
      const text = value.text.trim();
      return text.length === 0 ? { empty: true, raw } : { text, raw: raw || text };
    }
  }
  return { bad: "error-cell", raw };
}

function occupied(cell: ReadCell) {
  return !("empty" in cell);
}

function boundaryKind(raw: string): "email" | "mobile" | "national-id" | null {
  const western = westernDigits(raw);
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(raw) || /[^\s@]+@[^\s@]+\.[^\s@]+/.test(western)) {
    return "email";
  }
  const compact = western.replace(/[\s-]/g, "");
  if (/01[0125]\d{8}/.test(compact) || /(?:\+20|0020)1[0125]\d{8}/.test(compact)) return "mobile";
  if (/\d{14}/.test(western)) return "national-id";
  return null;
}

function validDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function afterFloor(year: number, month: number, day: number) {
  if (year > dateFloor.year) return true;
  if (year < dateFloor.year) return false;
  if (month > dateFloor.month) return true;
  if (month < dateFloor.month) return false;
  return day > dateFloor.day;
}

function calendarFromDate(date: Date) {
  const utcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  if (utcMidnight) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return { year, month, day, midnight: true, stamp: calendarStamp(year, month, day) };
  }
  const localMidnight =
    date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
  const year = localMidnight ? date.getFullYear() : date.getUTCFullYear();
  const month = (localMidnight ? date.getMonth() : date.getUTCMonth()) + 1;
  const day = localMidnight ? date.getDate() : date.getUTCDate();
  return { year, month, day, midnight: localMidnight, stamp: calendarStamp(year, month, day) };
}

function pushError(errors: SheetError[], row: number, column: string, cell: string, kind: ErrorKind) {
  errors.push({ row, column, cell, kind });
}

function parsePriceText(text: string): { kind: ErrorKind } | { price: string } {
  const western = westernDigits(text).trim();
  if (western.length === 0) return { kind: "empty" };
  if (western.startsWith("-")) return { kind: "negative" };
  if (!/^\d+(\.\d*)?$/.test(western)) return { kind: "pattern" };
  const [whole, fraction = ""] = western.split(".");
  if (fraction.length > priceScale) return { kind: "decimals" };
  const digits = whole.replace(/^0+(?=\d)/, "");
  if (digits.length > priceWholeLimit) return { kind: "price-range" };
  return { price: twoDecimals(`${digits}.${fraction}`) };
}

function parsePriceNumber(value: number, raw: string): { kind: ErrorKind } | { price: string } {
  const western = westernDigits(raw).trim();
  if (/^-?\d+(\.\d*)?$/.test(western)) return parsePriceText(western);
  if (!Number.isFinite(value)) return { kind: "pattern" };
  if (value < 0) return { kind: "negative" };
  if (value >= 10 ** priceWholeLimit) return { kind: "price-range" };
  const text = value.toFixed(priceScale);
  const rounded = Number(text);
  if (Number.isNaN(rounded) || Math.abs(value - rounded) > 1 / 1000 / 1000) return { kind: "decimals" };
  if (!/^\d{1,10}\.\d{2}$/.test(text)) return { kind: "price-range" };
  return { price: text };
}

function parseDateText(text: string): { kind: ErrorKind } | { iso: string } {
  const western = westernDigits(text).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d/.test(western)) return { kind: "time-part" };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(western);
  if (!match) return { kind: "not-a-date" };
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!validDate(year, month, day)) return { kind: "not-a-date" };
  if (!afterFloor(year, month, day)) return { kind: "date-floor" };
  return { iso: calendarStamp(year, month, day) };
}

function parseDateValue(date: Date): { kind: ErrorKind } | { iso: string } {
  const calendar = calendarFromDate(date);
  if (!calendar.midnight) return { kind: "time-part" };
  if (!validDate(calendar.year, calendar.month, calendar.day)) return { kind: "not-a-date" };
  if (!afterFloor(calendar.year, calendar.month, calendar.day)) return { kind: "date-floor" };
  return { iso: calendar.stamp };
}

function parseWhole(read: ReadCell): { kind: ErrorKind } | { value: number | null } {
  if ("empty" in read) return { value: null };
  if ("bad" in read) return { kind: read.bad };
  if ("date" in read) return { kind: "not-whole" };
  if ("number" in read) {
    if (!Number.isInteger(read.number) || read.number < 0 || read.number > displayOrderLimit) {
      return { kind: "not-whole" };
    }
    return { value: read.number };
  }
  const western = westernDigits(read.text).trim();
  if (!/^\d+$/.test(western)) return { kind: "not-whole" };
  const value = Number(western);
  if (!Number.isSafeInteger(value) || value > displayOrderLimit) return { kind: "not-whole" };
  return { value };
}

function lengthOf(value: string) {
  return [...value].length;
}

export async function readCampaignSheet(bytes: Uint8Array): Promise<{ rows: NormalisedRow[]; errors: SheetError[] }> {
  const workbook = await loadWorkbook(bytes);
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    return { rows: [], errors: [{ row: 1, column: "sheet", cell: "", kind: "wrong-sheet" }] };
  }
  const headerRow = sheet.getRow(1);
  for (let column = 1; column <= headers.length; column += 1) {
    const text = rawText(headerRow.getCell(column)).trim();
    if (text !== headers[column - 1]) {
      return {
        rows: [],
        errors: [{ row: 1, column: headers[column - 1] ?? "", cell: text, kind: "wrong-header" }],
      };
    }
  }

  const errors: SheetError[] = [];
  const rows: NormalisedRow[] = [];
  const width = Math.max(sheet.columnCount, headers.length);
  const depth = Math.max(sheet.rowCount, 1);

  for (let column = headers.length + 1; column <= width; column += 1) {
    const read = readCell(headerRow.getCell(column));
    if (occupied(read)) pushError(errors, 1, columnLabel(column), read.raw, "extra-cell");
  }

  for (let rowNumber = firstDataRow; rowNumber <= depth; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const reads: ReadCell[] = [];
    let any = false;
    for (let column = 1; column <= width; column += 1) {
      const read = readCell(row.getCell(column));
      reads.push(read);
      if (occupied(read)) any = true;
    }
    if (!any) continue;
    if (rowNumber > lastDataRow) {
      const first = reads.find(occupied);
      pushError(errors, rowNumber, columnLabel((reads.indexOf(first as ReadCell) + 1) || 1), first?.raw ?? "", "extra-cell");
      continue;
    }

    const before = errors.length;
    for (let column = headers.length + 1; column <= width; column += 1) {
      const read = reads[column - 1];
      if (read && occupied(read)) pushError(errors, rowNumber, columnLabel(column), read.raw, "extra-cell");
    }

    const parsed: Partial<NormalisedRow> = { sheet_row: rowNumber };
    headers.forEach((header, index) => {
      const read = reads[index];
      if (!read) return;
      const column = header;
      if (occupied(read)) {
        const boundary = boundaryKind(read.raw);
        if (boundary) {
          pushError(errors, rowNumber, column, read.raw, boundary);
          return;
        }
      }
      if ("bad" in read) {
        pushError(errors, rowNumber, column, read.raw, read.bad);
        return;
      }
      if (header === "code") {
        if ("empty" in read) {
          pushError(errors, rowNumber, column, read.raw, "empty");
          return;
        }
        if ("date" in read) {
          pushError(errors, rowNumber, column, read.raw, "pattern");
          return;
        }
        const code = "number" in read ? (Number.isInteger(read.number) && read.number >= 0 ? String(read.number) : "") : read.text.trim();
        if (!codePattern.test(code)) pushError(errors, rowNumber, column, read.raw, code ? "pattern" : "empty");
        else parsed.code = code;
        return;
      }
      if (header === "name_ar" || header === "name_en") {
        if ("empty" in read || "date" in read || "number" in read) {
          const text = "number" in read ? String(read.number) : "date" in read ? calendarFromDate(read.date).stamp : "";
          if (text.length === 0) pushError(errors, rowNumber, column, read.raw, "empty");
          else if (lengthOf(text) > nameLimit) pushError(errors, rowNumber, column, read.raw, "too-long");
          else parsed[header] = text;
          return;
        }
        if (read.text.length === 0) pushError(errors, rowNumber, column, read.raw, "empty");
        else if (lengthOf(read.text) > nameLimit) pushError(errors, rowNumber, column, read.raw, "too-long");
        else parsed[header] = read.text;
        return;
      }
      if (header === "price_egp") {
        if ("empty" in read) {
          pushError(errors, rowNumber, column, read.raw, "empty");
          return;
        }
        const price =
          "number" in read
            ? parsePriceNumber(read.number, read.raw)
            : "text" in read
              ? parsePriceText(read.text)
              : { kind: "pattern" as const };
        if ("kind" in price) pushError(errors, rowNumber, column, read.raw, price.kind);
        else parsed.price_egp = price.price;
        return;
      }
      if (header === "starts_on" || header === "ends_on") {
        if ("empty" in read) {
          if (header === "ends_on") pushError(errors, rowNumber, column, read.raw, "empty");
          else parsed.starts_on = null;
          return;
        }
        const dated =
          "date" in read
            ? parseDateValue(read.date)
            : "number" in read
              ? { kind: "not-a-date" as const }
              : "text" in read
                ? parseDateText(read.text)
                : { kind: "not-a-date" as const };
        if ("kind" in dated) pushError(errors, rowNumber, column, read.raw, dated.kind);
        else parsed[header] = dated.iso;
        return;
      }
      if (header === "conditions_ar" || header === "conditions_en") {
        if ("empty" in read) {
          parsed[header] = null;
          return;
        }
        const text = "text" in read ? read.text : "number" in read ? String(read.number) : calendarFromDate(read.date).stamp;
        if (lengthOf(text) > conditionLimit) pushError(errors, rowNumber, column, read.raw, "too-long");
        else parsed[header] = text;
        return;
      }
      const order = parseWhole(read);
      if ("kind" in order) pushError(errors, rowNumber, column, read.raw, order.kind);
      else parsed.display_order = order.value;
    });

    if (errors.length === before && parsed.code && parsed.name_ar && parsed.name_en && parsed.price_egp && parsed.ends_on) {
      const start = parsed.starts_on ?? null;
      if (start && start > parsed.ends_on) {
        pushError(errors, rowNumber, "starts_on", start, "start-after-end");
      }
      const left = parsed.conditions_ar ?? null;
      const right = parsed.conditions_en ?? null;
      if ((left === null) !== (right === null)) {
        pushError(errors, rowNumber, left === null ? "conditions_ar" : "conditions_en", "", "one-condition");
      }
      if (errors.length === before) {
        rows.push({
          sheet_row: rowNumber,
          code: parsed.code,
          name_ar: parsed.name_ar,
          name_en: parsed.name_en,
          price_egp: parsed.price_egp,
          starts_on: start,
          ends_on: parsed.ends_on,
          conditions_ar: left,
          conditions_en: right,
          display_order: parsed.display_order ?? null,
        });
      }
    }
  }

  const byKey = new Map<string, NormalisedRow[]>();
  for (const row of rows) {
    const key = row.code.toUpperCase();
    const group = byKey.get(key) ?? [];
    group.push(row);
    byKey.set(key, group);
  }
  const duplicated = new Set<number>();
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    for (const row of group) {
      duplicated.add(row.sheet_row);
      pushError(errors, row.sheet_row, "code", row.code, "duplicate-code");
    }
  }
  const kept = rows.filter((row) => !duplicated.has(row.sheet_row));
  if (kept.length === 0 && errors.length === 0) {
    pushError(errors, 1, "sheet", "", "no-rows");
  }
  return { rows: kept, errors };
}

export function sheetWarnings(rows: NormalisedRow[], today: string, published: boolean): SheetWarning[] {
  const warnings: SheetWarning[] = [];
  if (published) warnings.push({ row: 0, kind: "published" });
  for (const row of rows) {
    const started = row.starts_on === null || row.starts_on <= today;
    const open = today <= row.ends_on;
    if (row.ends_on < today) warnings.push({ row: row.sheet_row, kind: "ended" });
    if (!(started && open)) warnings.push({ row: row.sheet_row, kind: "not-visible" });
  }
  return warnings;
}
