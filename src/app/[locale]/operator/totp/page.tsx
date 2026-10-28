import { notFound, redirect } from "next/navigation";
import { LatinRun } from "@/components/latin-run";
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
    <>
      <h1>{heading}</h1>
      <p>{lead}</p>
      {failed ? <p>{messages.operator.totpError}</p> : null}
      {pane.kind === "enrol" ? (
        <>
          {/* The QR is a data URL. Raw SVG is not inserted into the document. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="operator-qr" src={pane.qr} alt={messages.operator.qrAlt} />
          <p className="operator-secret">
            {messages.operator.secretLabel} <LatinRun>{pane.secret}</LatinRun>
          </p>
        </>
      ) : null}
      {pane.kind === "failed" ? null : (
        <form className="operator-form" action={verifyTotp.bind(null, locale)}>
          <input type="hidden" name="factorId" value={pane.factorId} />
          <label>
            {messages.operator.codeLabel}
            <input name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} />
          </label>
          <button type="submit">{messages.operator.verify}</button>
        </form>
      )}
    </>
  );
}
