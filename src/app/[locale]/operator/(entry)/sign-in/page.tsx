import { notFound, redirect } from "next/navigation";
import { cardClass, fieldClass } from "@/components/operator-classes";
import { SubmitButton } from "@/components/submit-button";
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
    <div className={cardClass}>
      <h1 className="text-2xl">{messages.operator.signInHeading}</h1>
      {query.notice === "rejected" ? <p className="mt-3 text-sm text-error">{messages.operator.signInError}</p> : null}
      <form className="mt-4 flex flex-col gap-4" action={signIn.bind(null, locale)}>
        <label className="flex flex-col gap-1 text-sm">
          {messages.operator.emailLabel}
          <input className={fieldClass} name="email" type="email" autoComplete="username" required maxLength={320} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {messages.operator.passwordLabel}
          <input className={fieldClass} name="password" type="password" autoComplete="current-password" required maxLength={200} />
        </label>
        <SubmitButton label={messages.operator.submit} pendingLabel={messages.operator.pending} />
      </form>
      <p className="mt-4 text-sm text-muted">{messages.operator.recovery}</p>
    </div>
  );
}
