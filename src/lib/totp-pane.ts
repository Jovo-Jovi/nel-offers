import "server-only";
import type { OperatorClient } from "@/lib/supabase/server";

const secretLimit = 128;
const qrLimit = 100 * 1000;

export type TotpPane =
  | { kind: "verify"; factorId: string }
  | { kind: "enrol"; factorId: string; secret: string; qr: string }
  | { kind: "failed" };

function qrDataUrl(value: string): string | null {
  const ready = value.startsWith("data:image/")
    ? value
    : value.startsWith("<svg")
      ? `data:image/svg+xml;utf-8,${encodeURIComponent(value)}`
      : "";
  if (!ready.startsWith("data:image/") || ready.length > qrLimit) return null;
  return ready;
}

export async function readTotpPane(supabase: OperatorClient): Promise<TotpPane> {
  const listed = await supabase.auth.mfa.listFactors();
  if (listed.error || !listed.data) return { kind: "failed" };
  const verified = listed.data.totp[0];
  if (verified) return { kind: "verify", factorId: verified.id };
  for (const factor of listed.data.all) {
    if (factor.factor_type === "totp" && factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  const enrolled = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (enrolled.error || !enrolled.data || !("totp" in enrolled.data)) return { kind: "failed" };
  const secret = enrolled.data.totp.secret;
  const qr = qrDataUrl(enrolled.data.totp.qr_code);
  if (secret.length === 0 || secret.length > secretLimit || !qr) return { kind: "failed" };
  return { kind: "enrol", factorId: enrolled.data.id, secret, qr };
}
