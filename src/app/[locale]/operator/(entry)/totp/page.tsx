import { notFound, redirect } from "next/navigation";
import { LatinRun } from "@/components/latin-run";
import { cardClass, fieldClass } from "@/components/operator-classes";
import { SubmitButton } from "@/components/submit-button";
import { isLocale, messagesFor, operatorPath } from "@/i18n/config";
import { readOperatorGate } from "@/lib/operator-session";
import { readTotpPane } from "@/lib/totp-pane";
import { verifyTotp } from "./actions";

export default async function TotpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const gate = await readOperatorGate();
  if (gate.status === "no-session" || gate.status === "forbidden") {
    redirect(operatorPath(locale, "sign-in"));
  }
  if (gate.status === "ok") redirect(operatorPath(locale, "overview"));
  const messages = messagesFor(locale);
  const query = await searchParams;
  const pane = await readTotpPane(gate.supabase);
  const failed = query.notice === "rejected" || pane.kind === "failed";
  const heading = pane.kind === "verify" ? messages.operator.verifyHeading : messages.operator.enrolHeading;
  const lead = pane.kind === "verify" ? messages.operator.verifyLead : messages.operator.enrolLead;
  return (
    <div className={cardClass}>
      <h1 className="text-2xl">{heading}</h1>
      <p className="mt-3 text-sm">{lead}</p>
      {failed ? <p className="mt-3 text-sm text-error">{messages.operator.totpError}</p> : null}
      {pane.kind === "enrol" ? (
        <>
          {/* The QR is a data URL. Raw SVG is not inserted into the document. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mt-4 h-40 w-40" src={pane.qr} alt={messages.operator.qrAlt} />
          <p className="mt-3 text-sm">
            {messages.operator.secretLabel} <LatinRun>{pane.secret}</LatinRun>
          </p>
        </>
      ) : null}
      {pane.kind === "failed" ? null : (
        <form className="mt-4 flex flex-col gap-4" action={verifyTotp.bind(null, locale)}>
          <input type="hidden" name="factorId" value={pane.factorId} />
          <label className="flex flex-col gap-1 text-sm">
            {messages.operator.codeLabel}
            <input className={fieldClass} name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} />
          </label>
          <SubmitButton label={messages.operator.verify} pendingLabel={messages.operator.pending} />
        </form>
      )}
    </div>
  );
}
