import { notFound } from "next/navigation";
import { ImportPanel } from "@/components/import-panel";
import { isLocale, messagesFor } from "@/i18n/config";
import { requireOperator } from "@/lib/require-operator";

export default async function ImportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireOperator(locale);
  const messages = messagesFor(locale);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl">{messages.operator.importHeading}</h1>
      <ImportPanel locale={locale} />
    </div>
  );
}
