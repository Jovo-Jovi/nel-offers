"use client";

export function SlideSwitch({
  checked,
  disabled = false,
  label,
  large = false,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  large?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`nel-switch motion-reduce:transition-none ${large ? "nel-switch-large" : ""}`}
    >
      <span className="motion-reduce:transition-none" />
    </button>
  );
}
