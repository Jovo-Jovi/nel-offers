const slots = [
  { label: "اليوم" },
  { label: "الشهر" },
  { label: "السنة" },
] as const;

export function ExpiryBox() {
  return (
    <div className="text-start">
      <p className="text-sm font-bold text-dark">ينتهي العرض في:</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <div key={slot.label} className="rounded-card border border-border bg-primary-soft px-2 py-3 text-center">
            <span className="mx-auto block h-7 border-b-2 border-primary" aria-hidden="true" />
            <span className="mt-2 block text-xs font-bold text-muted">{slot.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
