import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { localeCodes, operatorPath, type Locale, type OperatorSegment } from "@/i18n/config";
import { readOperatorGate, type OperatorGate } from "@/lib/operator-session";

export async function requireOperator(locale: Locale): Promise<OperatorGate> {
  const gate = await readOperatorGate();
  if (gate.status === "aal1") redirect(operatorPath(locale, "totp"));
  if (gate.status !== "ok") redirect(operatorPath(locale, "sign-in"));
  return gate;
}

export function revalidateOperator(segment: OperatorSegment) {
  for (const locale of localeCodes) revalidatePath(operatorPath(locale, segment));
}
