import type { ReactNode } from "react";
import { LatinRun } from "@/components/latin-run";
import { splitToken } from "@/lib/fill-message";

export function NumberedLine({ template, number }: { template: string; number: string }) {
  const parts = splitToken(template, "number");
  return (
    <>
      {parts.before}
      <LatinRun>{number}</LatinRun>
      {parts.after}
    </>
  );
}

export function TokenLine({ template, token, value }: { template: string; token: string; value: ReactNode }) {
  const parts = splitToken(template, token);
  return (
    <>
      {parts.before}
      {value}
      {parts.after}
    </>
  );
}
