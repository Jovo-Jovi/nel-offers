"use client";

import { LoaderCircle as Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { primaryButton, quietButton } from "@/components/operator-classes";

export function SubmitButton({
  label,
  pendingLabel,
  disabled = false,
  quiet = false,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  quiet?: boolean;
}) {
  const { pending } = useFormStatus();
  const busy = pending || disabled;
  return (
    <button type="submit" disabled={busy} className={quiet ? quietButton : primaryButton}>
      {pending ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}

export function BusyButton({
  busy,
  label,
  pendingLabel,
  disabled = false,
  quiet = false,
  type = "button",
  onClick,
}: {
  busy: boolean;
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  quiet?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button type={type} disabled={busy || disabled} onClick={onClick} className={quiet ? quietButton : primaryButton}>
      {busy ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
      {busy ? pendingLabel : label}
    </button>
  );
}
