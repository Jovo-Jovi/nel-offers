import { CampaignOfferCard } from "@/components/public/campaign-offer-card";

type CampaignOfferGridProps = {
  action: string;
  cards: readonly {
    code: string;
    href: string;
    position: string;
    name: string;
    normalAr: string;
    normalEn: string;
    price: string | null;
    currency: string;
  }[];
};

export function CampaignOfferGrid({ cards, action }: CampaignOfferGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-campaign-offer-grid>
      {cards.map((card) => (
        <li
          key={card.code}
          className="min-w-0"
          data-campaign-offer-card
          data-code={card.code}
          data-name-ar={card.normalAr}
          data-name-en={card.normalEn}
        >
          <CampaignOfferCard
            href={card.href}
            position={card.position}
            name={card.name}
            price={card.price}
            currency={card.currency}
            action={action}
          />
        </li>
      ))}
    </ul>
  );
}
