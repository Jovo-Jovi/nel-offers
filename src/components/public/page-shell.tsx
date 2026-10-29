import type { ReactNode } from "react";
import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";

type PageShellProps = {
  subtitle: ReactNode;
  homeHref: string;
  siteName: string;
  markAlt: string;
  labSite: { href: string; label: string } | null;
  hotline: { href: string; template: string; number: string } | null;
  whatsapp: { href: string; template: string; number: string } | null;
  switchHref: string;
  switchLabel: string;
  dockActions?: boolean;
  hero?: ReactNode;
  children: ReactNode;
};

export function PageShell({
  subtitle,
  homeHref,
  siteName,
  markAlt,
  labSite,
  hotline,
  whatsapp,
  switchHref,
  switchLabel,
  dockActions = false,
  hero,
  children,
}: PageShellProps) {
  return (
    <div className={`flex min-h-screen flex-col bg-bg text-dark antialiased ${dockActions ? "pb-40 lg:pb-0" : ""}`}>
      <Header
        subtitle={subtitle}
        homeHref={homeHref}
        siteName={siteName}
        markAlt={markAlt}
        labSite={labSite}
      />
      {hero}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
      <Footer
        hotline={hotline}
        whatsapp={whatsapp}
        switchHref={switchHref}
        switchLabel={switchLabel}
      />
    </div>
  );
}
