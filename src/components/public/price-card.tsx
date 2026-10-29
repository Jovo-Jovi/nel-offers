import { LatinRun } from "@/components/latin-run";

type PriceCardProps = {
  label: string;
  value: string;
  currency: string;
};

export function PriceCard({ label, value, currency }: PriceCardProps) {
  return (
    <div className="text-start">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-3 flex flex-wrap items-end gap-3 font-bold text-primary">
        <span className="inline-block min-w-28 border-b-2 border-primary pb-1 text-4xl leading-none">
          <LatinRun>{value}</LatinRun>
        </span>
        <span className="pb-1 text-lg">{currency}</span>
      </p>
    </div>
  );
}
