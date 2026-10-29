type PriceCardProps = {
  value?: string;
};

export function PriceCard({ value }: PriceCardProps) {
  const price = value?.trim() ? value.trim() : "\u00A0";

  return (
    <div className="text-start">
      <p className="text-sm font-medium text-muted">سعر العرض</p>
      <p className="mt-3 flex flex-wrap items-end gap-3 font-bold text-primary">
        <span className="inline-block min-w-28 border-b-2 border-primary pb-1 text-4xl leading-none">{price}</span>
        <span className="pb-1 text-lg">جنيه مصري</span>
      </p>
    </div>
  );
}
