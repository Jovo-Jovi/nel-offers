// DATA_MODEL.md §4 and §6 rule 5. Every limit a message shows comes from here.
export const sheetName = "Offers";

export const headers = [
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

export type SheetHeader = (typeof headers)[number];

export const firstDataRow = 2;
export const lastDataRow = 501;
export const maxSheetRows = 500;
export const dateFloor = { year: 2026, month: 1, day: 1 };
export const nameLimit = 2 * 100;
export const conditionLimit = 2 * 1000;
export const displayTextLimit = 32;
export const siteUrlLimit = 2 * 100;
export const codeMin = 2;
export const codeMax = 20;
export const workbookByteLimit = 2 * 1024 * 1024;
export const priceScale = 2;
export const priceWholeLimit = 10;
export const displayOrderLimit = 2 * 1000 * 1000 * 1000 + 147 * 1000 * 1000 + 483 * 1000 + 647;

export const codePattern = /^[A-Za-z0-9-]{2,20}$/;
export const whatsappDigitsPattern = /^[1-9][0-9]{7,14}$/;
export const hotlineDialPattern = /^\+?[0-9]{3,15}$/;
export const siteUrlPattern = /^https:\/\/\S+$/;

export function pad2(value: number) {
  return value < 10 ? `0${value}` : String(value);
}

export function calendarStamp(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function twoDecimals(value: string) {
  const match = /^(\d+)(?:\.(\d*))?$/.exec(value.trim());
  if (!match) return value.trim();
  const whole = match[1].replace(/^0+(?=\d)/, "");
  const rawFraction = match[2] ?? "";
  if (rawFraction.length > priceScale && !/^0*$/.test(rawFraction.slice(priceScale))) return value.trim();
  return `${whole}.${rawFraction.slice(0, priceScale).padEnd(priceScale, "0")}`;
}
