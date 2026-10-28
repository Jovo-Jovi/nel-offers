"use server";

import { redirect } from "next/navigation";
import { operatorPath, type Locale } from "@/i18n/config";
import { createOperatorClient } from "@/lib/supabase/server";

export async function verifyTotp(locale: Locale, formData: FormData) {
  const factorValue = formData.get("factorId");
  const codeValue = formData.get("code");
  const rejected = `${operatorPath(locale, "totp")}?notice=rejected`;
  if (typeof factorValue !== "string" || typeof codeValue !== "string") redirect(rejected);
  if (!/^[A-Za-z0-9-]{1,80}$/.test(factorValue) || !/^[0-9]{6}$/.test(codeValue)) redirect(rejected);
  const supabase = await createOperatorClient();
  const challenged = await supabase.auth.mfa.challenge({ factorId: factorValue });
  if (challenged.error || !challenged.data || !("id" in challenged.data)) redirect(rejected);
  const verified = await supabase.auth.mfa.verify({
    factorId: factorValue,
    challengeId: challenged.data.id,
    code: codeValue,
  });
  if (verified.error) redirect(rejected);
  const { data: operatorAccount, error: rpcError } = await supabase.rpc("is_operator");
  if (rpcError || operatorAccount !== true) {
    redirect(`${operatorPath(locale, "sign-in")}?notice=rejected`);
  }
  redirect(operatorPath(locale, "overview"));
}
