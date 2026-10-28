import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, prefixedLocale } from "./i18n/config";

function firstSegment(pathname: string): string | undefined {
  const parts = pathname.split("/").filter((part) => part.length > 0);
  return parts[0];
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = firstSegment(pathname);

  if (segment === prefixedLocale) {
    return NextResponse.next();
  }

  if (segment === defaultLocale) {
    const rest = pathname.slice(`/${defaultLocale}`.length);
    const destination = rest.length > 0 ? rest : "/";
    return NextResponse.redirect(new URL(destination, request.url), 308);
  }

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|.*\\..*).*)"],
};
