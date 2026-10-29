import { intlLocale, type Locale } from "../i18n/config";

const bidiMarks = /[\u200E\u200F\u061C]/g;

function withoutBidiMarks(value: string) {
  return value.replace(bidiMarks, "");
}

export function formatCount(locale: Locale, value: number) {
  return withoutBidiMarks(new Intl.NumberFormat(intlLocale(locale)).format(value));
}

export function formatPrice(locale: Locale, value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return withoutBidiMarks(
    new Intl.NumberFormat(intlLocale(locale), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number),
  );
}

export function calendarParts(iso: string) {
  const match = /^(\d+)-(\d+)-(\d+)$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return { year: String(year), month: String(month), day: String(day) };
}

export function formatCalendar(locale: Locale, iso: string) {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  if (!year || !month || !day) return iso;
  return withoutBidiMarks(
    new Intl.DateTimeFormat(intlLocale(locale), {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(Date.UTC(year, month - 1, day))),
  );
}

export function formatStamp(locale: Locale, iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function megabytes(bytes: number) {
  return String(Math.round(bytes / (1024 * 1024)));
}

export function formatByteSize(locale: Locale, bytes: number) {
  const absolute = Math.max(0, bytes);
  const unit = absolute >= 1024 * 1024 ? "megabyte" : absolute >= 1024 ? "kilobyte" : "byte";
  const value = unit === "megabyte" ? absolute / (1024 * 1024) : unit === "kilobyte" ? absolute / 1024 : absolute;
  return withoutBidiMarks(
    new Intl.NumberFormat(intlLocale(locale), {
      style: "unit",
      unit,
      unitDisplay: "short",
      maximumFractionDigits: unit === "byte" ? 0 : 1,
    }).format(value),
  );
}

export function cairoDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
