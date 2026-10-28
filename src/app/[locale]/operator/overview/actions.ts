"use server";

import { redirect } from "next/navigation";
import { operatorPath, type Locale } from "@/i18n/config";
import { createOperatorClient } from "@/lib/supabase/server";

export async function signOut(locale: Locale) {
  const supabase = await createOperatorClient();
  await supabase.auth.signOut();
  redirect(operatorPath(locale, "sign-in"));
}
