import "server-only";
import type { OperatorGate } from "@/lib/operator-session";
import { deleteObject } from "@/lib/r2";

export async function objectKeyState(gate: OperatorGate, objectKey: string) {
  const { data, error } = await gate.supabase
    .from("MediaObject")
    .select("id")
    .eq("object_key", objectKey)
    .maybeSingle();
  if (error) return "unknown" as const;
  return data ? ("recorded" as const) : ("absent" as const);
}

export async function discardUnrecorded(gate: OperatorGate, objectKey: string) {
  try {
    const state = await objectKeyState(gate, objectKey);
    if (state === "absent") await deleteObject(objectKey);
  } catch {
    // A leftover is reported by the media scan.
  }
}
