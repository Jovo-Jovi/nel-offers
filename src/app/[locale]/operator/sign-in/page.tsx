import { notFound, redirect } from "next/navigation";
import { isLocale, messagesFor, operatorPath } from "@/i18n/config";
import { readOperatorGate } from "@/lib/operator-session";
import { signIn } from "./actions";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const gate = await readOperatorGate();
  if (gate.status === "aal1") redirect(operatorPath(locale, "totp"));
  if (gate.status === "ok") redirect(operatorPath(locale, "overview"));
  const messages = messagesFor(locale);
  const query = await searchParams;
  return (
    <>
      <h1>{messages.operator.signInHeading}</h1>
      {query.notice === "rejected" ? <p>{messages.operator.signInError}</p> : null}
      <form className="operator-form" action={signIn.bind(null, locale)}>
        <label>
          {messages.operator.emailLabel}
          <input name="email" type="email" autoComplete="username" required maxLength={320} />
        </label>
        <label>
          {messages.operator.passwordLabel}
          <input name="password" type="password" autoComplete="current-password" required maxLength={200} />
        </label>
        <button type="submit">{messages.operator.submit}</button>
      </form>
      <p>{messages.operator.recovery}</p>
    </>
  );
}
