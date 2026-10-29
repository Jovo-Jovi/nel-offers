import type { Offer } from "@/data/offers";
import { OfferCard } from "@/components/OfferCard";

type OfferGridProps = {
  offers: Offer[];
};

export function OfferGrid({ offers }: OfferGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {offers.map((offer) => (
        <li key={offer.code} className="min-w-0">
          <OfferCard offer={offer} />
        </li>
      ))}
    </ul>
  );
}
