import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionButtons } from "@/components/ActionButtons";
import { CodeBadge } from "@/components/CodeBadge";
import { ExpiryBox } from "@/components/ExpiryBox";
import { MediaSlot } from "@/components/MediaSlot";
import { PageShell } from "@/components/PageShell";
import { PriceCard } from "@/components/PriceCard";
import { TermsBox } from "@/components/TermsBox";
import { ThumbnailRow } from "@/components/ThumbnailRow";
import { galleryImages, offers } from "@/data/offers";

type OfferPageProps = {
  params: Promise<{ code: string }>;
};

export function generateStaticParams() {
  return offers.map((offer) => ({ code: offer.code }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: OfferPageProps): Promise<Metadata> {
  const { code } = await params;
  return { title: `كود ${code}` };
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { code } = await params;
  const offer = offers.find((item) => item.code === code);

  if (!offer) {
    notFound();
  }

  const thumbnails = [offer.image, ...galleryImages.filter((image) => image !== offer.image)]
    .slice(0, 3)
    .map((src, index) => ({
      id: String(index + 1),
      label: `صورة ${index + 1}`,
      src,
      active: index === 0,
    }));

  return (
    <PageShell subtitle={`كود ${offer.code} ـــ تفاصيل العرض`} pageNumber={2} dockActions>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_22rem] lg:gap-10">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="w-fit text-sm font-bold text-primary no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              → كل العروض
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 text-start">
                <h1 className="text-3xl font-bold leading-tight text-dark sm:text-4xl">اسم التحليل بالعربي</h1>
                <p dir="ltr" lang="en" className="mt-2 text-end text-sm text-muted">
                  English Test Name (optional)
                </p>
              </div>
              <CodeBadge code={offer.code} />
            </div>
          </div>
          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,1fr)_7.5rem] md:items-stretch">
            <MediaSlot src={offer.image} />
            <ThumbnailRow items={thumbnails} />
          </div>
        </section>

        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="flex flex-col gap-6 p-5 sm:p-6">
              <PriceCard />
              <ExpiryBox />
              <TermsBox />
              <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:border-t max-lg:border-border max-lg:bg-surface max-lg:px-4 max-lg:py-3 max-lg:shadow-card">
                <ActionButtons />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
