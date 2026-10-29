import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

type PageShellProps = {
  subtitle: string;
  pageNumber: number;
  dockActions?: boolean;
  hero?: ReactNode;
  children: ReactNode;
};

export function PageShell({
  subtitle,
  pageNumber,
  dockActions = false,
  hero,
  children,
}: PageShellProps) {
  return (
    <div className={`flex min-h-screen flex-col bg-bg text-dark ${dockActions ? "pb-40 lg:pb-0" : ""}`}>
      <Header subtitle={subtitle} />
      {hero}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
      <Footer pageNumber={pageNumber} />
    </div>
  );
}
