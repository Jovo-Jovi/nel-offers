import { describe, expect, it } from "vitest";
import { defaultLocale, prefixedLocale } from "@/i18n/config";
import { formatCalendar, formatPrice } from "./format-values";

const bidiMarks = /[\u200E\u200F\u061C]/;

describe("formatters placed in LatinRun", () => {
  it("formats 18 November 2026 without bidi marks", () => {
    const year = 2026;
    const month = 11;
    const day = 18;
    const iso = [String(year), String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
    const arabic = formatCalendar(defaultLocale, iso);
    const english = formatCalendar(prefixedLocale, iso);
    expect(arabic).toBe("18/11/2026");
    expect(english).toBe("11/18/2026");
    expect(arabic).not.toMatch(bidiMarks);
    expect(english).not.toMatch(bidiMarks);
  });

  it("formats a price with western grouping in both locales", () => {
    expect(formatPrice(defaultLocale, "1234.5")).toBe("1,234.50");
    expect(formatPrice(prefixedLocale, "1234.5")).toBe("1,234.50");
  });
});
