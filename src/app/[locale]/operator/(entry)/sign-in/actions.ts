"use server";

import { redirect } from "next/navigation";
import { operatorPath, type Locale } from "@/i18n/config";
import { createOperatorClient } from "@/lib/supabase/server";

const emailLimit = 320;
const passwordLimit = 200;

export async function signIn(locale: Locale, formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const rejected = `${operatorPath(locale, "sign-in")}?notice=rejected`;
  if (email.length === 0 || email.length > emailLimit || password.length === 0 || password.length > passwordLimit) {
    redirect(rejected);
  }
  const supabase = await createOperatorClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(rejected);
  redirect(operatorPath(locale, "totp"));
}
