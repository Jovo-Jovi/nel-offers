import Link from "next/link";
import { LatinRun } from "@/components/latin-run";

type CampaignOfferCardProps = {
  href: string;
  position: string;
  code: string;
  name: string;
  price: string | null;
  currency: string;
};

export function CampaignOfferCard({ href, position, code, name, price, currency }: CampaignOfferCardProps) {
  return (
    <article className="h-full rounded-card border border-border bg-bg transition duration-200 hover:border-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary">
      <Link href={href} className="flex h-full items-center gap-3 p-3 no-underline focus-visible:outline-none">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-primary text-sm font-bold text-surface">
          <LatinRun>{position}</LatinRun>
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block text-xs font-bold text-primary">
            <LatinRun>{code}</LatinRun>
          </span>
          <h2 className="truncate text-sm font-bold text-dark">{name}</h2>
          {price ? (
            <span className="mt-1 flex items-end gap-1.5 whitespace-nowrap text-primary">
              <span className="inline-block min-w-8 border-b-2 border-primary text-sm font-bold leading-none">
                <LatinRun>{price}</LatinRun>
              </span>
              <span className="text-xs font-bold">{currency}</span>
            </span>
          ) : null}
        </span>
        <span className="inline-block shrink-0 text-sm font-bold text-primary public-mirror-ltr" aria-hidden="true">
          ←
        </span>
      </Link>
    </article>
  );
}
