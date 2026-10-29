import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { OperatorFeedback } from "@/components/operator-feedback";
import { OperatorMark } from "@/components/operator-mark";
import { DashboardNav } from "@/components/dashboard-nav";
import { SubmitButton } from "@/components/submit-button";
import { isLocale, messagesFor, operatorPath, operatorSegment } from "@/i18n/config";
import { readOperatorGate } from "@/lib/operator-session";
import { OperatorLocaleSwitch } from "../locale-switch";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const gate = await readOperatorGate();
  if (gate.status === "aal1") redirect(operatorPath(locale, "totp"));
  if (gate.status !== "ok") redirect(operatorPath(locale, "sign-in"));
  const messages = messagesFor(locale);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const segment = operatorSegment(pathname);
  return (
    <OperatorFeedback locale={locale}>
      <div className="flex min-h-dvh min-w-0 flex-col bg-bg text-dark">
        <header className="flex min-w-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <OperatorMark alt={messages.a11y.mark} />
          <div className="min-w-0">
            <p className="text-sm font-medium">{messages.site.name}</p>
            <p className="text-xs text-muted">{messages.nav.dashboard}</p>
          </div>
          <DashboardNav locale={locale} current={segment} />
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <OperatorLocaleSwitch locale={locale} segment={segment} />
            <form action={signOut.bind(null, locale)}>
              <SubmitButton quiet label={messages.operator.signOut} pendingLabel={messages.operator.pending} />
            </form>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
    </OperatorFeedback>
  );
}
