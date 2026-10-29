import { messagesFor, operatorPath, otherLocale, type Locale, type OperatorSegment } from "@/i18n/config";
import { focusRing } from "@/components/operator-classes";

export function OperatorLocaleSwitch({
  locale,
  segment,
}: {
  locale: Locale;
  segment: OperatorSegment;
}) {
  const messages = messagesFor(locale);
  return (
    <a className={`rounded-button px-3 py-2 text-sm ${focusRing}`} href={operatorPath(otherLocale(locale), segment)}>
      {messages.nav.switchLocale}
    </a>
  );
}
