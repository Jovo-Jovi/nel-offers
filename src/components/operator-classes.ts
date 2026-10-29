export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const primaryButton = `inline-flex items-center justify-center gap-2 rounded-button bg-primary px-5 py-2 text-sm font-medium text-surface disabled:opacity-60 ${focusRing}`;

export const quietButton = `inline-flex items-center justify-center gap-2 rounded-button border border-border bg-surface px-5 py-2 text-sm text-dark disabled:opacity-60 ${focusRing}`;

export const dangerButton = `inline-flex items-center justify-center gap-2 rounded-button border border-error bg-error px-5 py-2 text-sm font-medium text-surface disabled:opacity-60 ${focusRing}`;

export const removeControl = `inline-flex items-center justify-center gap-1 rounded-button border border-error bg-surface px-3 py-2 text-sm text-error disabled:opacity-60 ${focusRing}`;

export const fieldClass = `w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-base text-dark ${focusRing}`;

export const cardClass = "min-w-0 rounded-card bg-surface p-5 shadow-card";
