import { jsonCode } from "@/lib/json-code";
import { denyUnlessOperator, readOperatorGate, type OperatorGate } from "@/lib/operator-session";

export async function withOperator(run: (gate: OperatorGate) => Promise<Response>) {
  let gate: OperatorGate;
  try {
    gate = await readOperatorGate();
  } catch {
    return jsonCode(401, "no-session");
  }
  const denied = denyUnlessOperator(gate);
  if (denied) return denied;
  return run(gate);
}
