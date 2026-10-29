import {
  firstDataRow,
  headers,
  lastDataRow,
  sheetName,
} from "@/lib/sheet-format";
import type { NormalisedRow } from "@/lib/campaign-sheet";
import { loadWorkbook } from "@/lib/workbook-bytes";

function utcDate(iso: string) {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
}

export async function buildCampaignExport(template: Uint8Array, rows: NormalisedRow[]) {
  const workbook = await loadWorkbook(template);
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) throw new Error("template-sheet");
  for (let index = firstDataRow; index <= lastDataRow; index += 1) {
    const row = sheet.getRow(index);
    for (let column = 1; column <= headers.length; column += 1) {
      row.getCell(column).value = null;
    }
  }
  rows.forEach((record, index) => {
    const row = sheet.getRow(firstDataRow + index);
    row.getCell(1).value = record.code;
    row.getCell(2).value = record.name_ar;
    row.getCell(3).value = record.name_en;
    row.getCell(4).value = Number(record.price_egp);
    const start = row.getCell(5);
    if (record.starts_on) {
      start.value = utcDate(record.starts_on);
      start.numFmt = "yyyy-mm-dd";
    } else {
      start.value = null;
    }
    const end = row.getCell(6);
    end.value = utcDate(record.ends_on);
    end.numFmt = "yyyy-mm-dd";
    row.getCell(7).value = record.conditions_ar;
    row.getCell(8).value = record.conditions_en;
    row.getCell(9).value = record.display_order;
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
