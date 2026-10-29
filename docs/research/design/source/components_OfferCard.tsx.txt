import Link from "next/link";
import type { Offer } from "@/data/offers";

type OfferCardProps = {
  offer: Offer;
};

export function OfferCard({ offer }: OfferCardProps) {
  const price = offer.priceEgp?.trim() ? offer.priceEgp.trim() : "\u00A0";

  return (
    <article className="h-full rounded-card border border-border bg-bg transition duration-200 hover:border-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary">
      <Link
        href={`/offers/${offer.code}`}
        className="flex h-full items-center gap-3 p-3 no-underline focus-visible:outline-none"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-primary text-sm font-bold text-surface">
          {offer.number}
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span dir="ltr" className="block text-xs font-bold text-primary">
            {offer.code}
          </span>
          <h2 className="truncate text-sm font-bold text-dark">{offer.titleAr}</h2>
          <span className="mt-1 flex items-end gap-1.5 whitespace-nowrap text-primary">
            <span className="inline-block min-w-8 border-b-2 border-primary text-sm font-bold leading-none">{price}</span>
            <span className="text-xs font-bold">جنيه مصري</span>
          </span>
        </span>
        <span className="shrink-0 text-sm font-bold text-primary" aria-hidden="true">
          ←
        </span>
      </Link>
    </article>
  );
}
