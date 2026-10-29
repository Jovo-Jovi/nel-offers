import ExcelJS from "exceljs";

const headers = [
  "code",
  "name_ar",
  "name_en",
  "price_egp",
  "starts_on",
  "ends_on",
  "conditions_ar",
  "conditions_en",
  "display_order",
] as const;

export type Cell = string | number | null;

export async function workbookBytes(rows: Cell[][]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Offers");
  headers.forEach((header, index) => {
    sheet.getCell(1, index + 1).value = header;
  });
  rows.forEach((row, rowIndex) => {
    row.forEach((value, column) => {
      if (value !== null) sheet.getCell(rowIndex + 2, column + 1).value = value;
    });
  });
  const out = await workbook.xlsx.writeBuffer();
  return Buffer.from(out);
}
