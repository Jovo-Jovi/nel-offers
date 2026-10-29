import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OperatorFeedback } from "@/components/operator-feedback";
import { OperatorMark } from "@/components/operator-mark";
import { isLocale, messagesFor, operatorSegment } from "@/i18n/config";
import { OperatorLocaleSwitch } from "../locale-switch";

export default async function EntryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = messagesFor(locale);
  const pathname = (await headers()).get("x-pathname") ?? "";
  return (
    <OperatorFeedback locale={locale}>
      <div className="flex min-h-dvh min-w-0 flex-col bg-bg text-dark">
        <header className="flex min-w-0 flex-wrap items-center gap-3 px-4 py-4">
          <OperatorMark alt={messages.a11y.mark} />
          <div className="min-w-0">
            <p className="text-sm font-medium">{messages.site.name}</p>
            <p className="text-xs text-muted">{messages.site.campaignTitle}</p>
          </div>
          <div className="ms-auto">
            <OperatorLocaleSwitch locale={locale} segment={operatorSegment(pathname)} />
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-md flex-1 px-4 py-6">{children}</main>
      </div>
    </OperatorFeedback>
  );
}
