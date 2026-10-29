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

export function campaignOfferPath(locale: Locale, code: string): string {
  if (locale === defaultLocale) return `/campaign-offers/${code}`;
  return `/${locale}/campaign-offers/${code}`;
}

export function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter((part) => part.length > 0)[0];
  if (segment === prefixedLocale) return prefixedLocale;
  return defaultLocale;
}

export function switchedPath(pathname: string, locale: Locale): string {
  const target = otherLocale(locale);
  const parts = pathname.split("/").filter((part) => part.length > 0);
  if (parts[0] === prefixedLocale) parts.shift();
  const rest = parts.join("/");
  if (target === defaultLocale) return rest.length > 0 ? `/${rest}` : "/";
  return rest.length > 0 ? `/${target}/${rest}` : `/${target}`;
}

export const operatorSegments = [
  "sign-in",
  "totp",
  "overview",
  "campaign-offers",
  "import",
  "media-objects",
  "campaign-settings",
] as const;

export type OperatorSegment = (typeof operatorSegments)[number];

export function operatorSegment(pathname: string): OperatorSegment {
  for (const segment of operatorSegments) {
    if (pathname === `/operator/${segment}` || pathname.endsWith(`/operator/${segment}`)) return segment;
  }
  return "sign-in";
}

export function operatorPath(locale: Locale, segment: OperatorSegment): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${prefix}/operator/${segment}`;
}
