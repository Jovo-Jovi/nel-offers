// DESIGN_SYSTEM.md §5. Locale codes and directions live only in this file.
import type { Catalogue } from "./ar";
import { catalogue as arabicCatalogue } from "./ar";
import { catalogue as englishCatalogue } from "./en";

export const localeCodes = ["ar", "en"] as const;

export type Locale = (typeof localeCodes)[number];

export const defaultLocale: Locale = "ar";

export const prefixedLocale: Locale = "en";

const directionByLocale = {
  ar: "rtl",
  en: "ltr",
} as const;

const catalogueByLocale: Record<Locale, Catalogue> = {
  ar: arabicCatalogue,
  en: englishCatalogue,
};

export function isLocale(value: string): value is Locale {
  return localeCodes.some((code) => code === value);
}

export function directionFor(locale: Locale) {
  return directionByLocale[locale];
}

export function intlLocale(locale: Locale): string {
  return `${locale}-u-nu-latn`;
}

export const latinRunDirection = directionByLocale.en;

export function messagesFor(locale: Locale): Catalogue {
  return catalogueByLocale[locale];
}

export function otherLocale(locale: Locale): Locale {
  return locale === defaultLocale ? prefixedLocale : defaultLocale;
}

export function homePath(locale: Locale): string {
  if (locale === defaultLocale) {
    return "/";
  }
  return `/${locale}`;
}

export function operatorPath(
  locale: Locale,
  segment: "sign-in" | "totp" | "overview",
): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${prefix}/operator/${segment}`;
}
