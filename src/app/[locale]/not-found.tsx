import Link from "next/link";
import { headers } from "next/headers";
import { PageShell } from "@/components/public/page-shell";
import { homePath, localeFromPathname, messagesFor, switchedPath } from "@/i18n/config";
import { loadPublishedCampaign } from "@/lib/public-data";
import { shellProps } from "@/lib/public-shell";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default async function NotFound() {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const locale = localeFromPathname(pathname);
  const messages = messagesFor(locale);
  const campaign = await loadPublishedCampaign();
  return (
    <PageShell {...shellProps(locale, campaign, messages.header.homeSubtitle, switchedPath(pathname, locale))}>
      <div className="flex flex-col gap-4">
        <Link
          href={homePath(locale)}
          className={`w-fit text-sm font-bold text-primary no-underline ${focusRing}`}
        >
          <span className="inline-block public-mirror-ltr" aria-hidden="true">
            →
          </span>{" "}
          {messages.nav.allCampaignOffers}
        </Link>
        <h1 className="text-3xl font-bold leading-tight text-dark sm:text-4xl">{messages.campaignOffer.notFound}</h1>
      </div>
    </PageShell>
  );
}
