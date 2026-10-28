import { messagesFor, operatorPath, otherLocale, type Locale } from "@/i18n/config";

export function OperatorLocaleSwitch({
  locale,
  segment,
}: {
  locale: Locale;
  segment: "sign-in" | "totp" | "overview";
}) {
  const messages = messagesFor(locale);
  return <a href={operatorPath(otherLocale(locale), segment)}>{messages.nav.switchLocale}</a>;
}
