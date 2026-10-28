import type { ReactNode } from "react";
import { latinRunDirection } from "@/i18n/config";

export function LatinRun({ children }: { children: ReactNode }) {
  return <bdi dir={latinRunDirection}>{children}</bdi>;
}
