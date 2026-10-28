import { notFound, redirect } from "next/navigation";
import { isLocale, messagesFor, operatorPath } from "@/i18n/config";
import { readOperatorGate } from "@/lib/operator-session";
import { signOut } from "./actions";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const gate = await readOperatorGate();
  if (gate.status === "aal1") redirect(operatorPath(locale, "totp"));
  if (gate.status !== "ok") redirect(operatorPath(locale, "sign-in"));
  const messages = messagesFor(locale);
  return (
    <>
      <h1>{messages.operator.overviewHeading}</h1>
      <p>{messages.operator.signedIn}</p>
      <form className="operator-form" action={signOut.bind(null, locale)}>
        <button type="submit">{messages.operator.signOut}</button>
      </form>
    </>
  );
}
