type Thumbnail = {
  id: string;
  label: string;
  src: string;
  active?: boolean;
};

type ThumbnailRowProps = {
  items: readonly Thumbnail[];
};

export function ThumbnailRow({ items }: ThumbnailRowProps) {
  return (
    <ul className="grid grid-cols-3 gap-3 md:h-full md:grid-cols-1 md:grid-rows-3">
      {items.map((thumb) => (
        <li key={thumb.id} className="md:min-h-0">
          <div
            className={`flex h-full flex-col overflow-hidden rounded-card border bg-primary-soft ${
              thumb.active ? "border-primary" : "border-border"
            }`}
            aria-current={thumb.active ? "true" : undefined}
          >
            <img
              src={thumb.src}
              alt={thumb.label}
              className="aspect-[4/3] w-full object-cover md:aspect-auto md:min-h-0 md:flex-1"
            />
            <p
              className={`px-2 py-2 text-center text-xs font-bold ${
                thumb.active ? "text-primary" : "text-muted"
              }`}
            >
              {thumb.label}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
