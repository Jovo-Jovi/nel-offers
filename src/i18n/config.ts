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
  return `/${locale}`;
}

export function campaignOfferPath(locale: Locale, code: string): string {
  return `/${locale}/campaign-offers/${code}`;
}

export function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter((part) => part.length > 0)[0];
  if (segment && isLocale(segment)) return segment;
  return defaultLocale;
}

export function switchedPath(pathname: string, locale: Locale): string {
  const target = otherLocale(locale);
  const parts = pathname.split("/").filter((part) => part.length > 0);
  if (parts[0] && isLocale(parts[0])) parts.shift();
  const rest = parts.join("/");
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
  const parts = pathname.split("/").filter((part) => part.length > 0);
  if (parts[0] && isLocale(parts[0])) parts.shift();
  const segment = parts[0] === "operator" ? parts[1] : undefined;
  for (const candidate of operatorSegments) {
    if (segment === candidate) return candidate;
  }
  return "sign-in";
}

export function operatorPath(locale: Locale, segment: OperatorSegment): string {
  return `/${locale}/operator/${segment}`;
}
