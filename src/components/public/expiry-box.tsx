import { LatinRun } from "@/components/latin-run";

type ExpiryBoxProps = {
  label: string;
  day: string;
  month: string;
  year: string;
  dayLabel: string;
  monthLabel: string;
  yearLabel: string;
};

export function ExpiryBox({ label, day, month, year, dayLabel, monthLabel, yearLabel }: ExpiryBoxProps) {
  const slots = [
    { value: day, caption: dayLabel },
    { value: month, caption: monthLabel },
    { value: year, caption: yearLabel },
  ];
  return (
    <div className="text-start">
      <p className="text-sm font-bold text-dark">{label}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <div key={slot.caption} className="rounded-card border border-border bg-primary-soft px-2 py-3 text-center">
            <span className="mx-auto block border-b-2 border-primary text-lg font-bold leading-7">
              <LatinRun>{slot.value}</LatinRun>
            </span>
            <span className="mt-2 block text-xs font-bold text-muted">{slot.caption}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
