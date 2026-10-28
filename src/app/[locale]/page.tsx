import Image from "next/image";
import { notFound } from "next/navigation";
import { homePath, isLocale, messagesFor, otherLocale } from "@/i18n/config";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const messages = messagesFor(locale);
  return (
    <>
      <header className="site-bar">
        <Image
          className="site-mark"
          src="/mark/nel-mark.png"
          alt={messages.a11y.mark}
          width={537}
          height={752}
          unoptimized
        />
        <div>
          <p className="site-name">{messages.site.name}</p>
          <p>{messages.site.campaignTitle}</p>
        </div>
      </header>
      <main className="site-main">
        <p>{messages.home.comingSoon}</p>
      </main>
      <footer className="site-footer">
        <a href={homePath(otherLocale(locale))}>{messages.nav.switchLocale}</a>
      </footer>
    </>
  );
}
