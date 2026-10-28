import "server-only";
import { jsonCode } from "@/lib/json-code";
import { createOperatorClient, type OperatorClient } from "@/lib/supabase/server";

export type GateStatus = "no-session" | "aal1" | "forbidden" | "ok";

export type OperatorGate = {
  status: GateStatus;
  supabase: OperatorClient;
};

export async function readOperatorGate(): Promise<OperatorGate> {
  const supabase = await createOperatorClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return { status: "no-session", supabase };
  if (data.claims.aal !== "aal2") return { status: "aal1", supabase };
  const { data: operatorAccount, error: rpcError } = await supabase.rpc("is_operator");
  if (rpcError || operatorAccount !== true) return { status: "forbidden", supabase };
  return { status: "ok", supabase };
}

export function denyUnlessOperator(gate: OperatorGate) {
  if (gate.status === "ok") return null;
  if (gate.status === "no-session") return jsonCode(401, "no-session");
  return jsonCode(403, "forbidden");
}
