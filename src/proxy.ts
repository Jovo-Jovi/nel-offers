import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, prefixedLocale } from "./i18n/config";

type StoredCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function firstSegment(pathname: string): string | undefined {
  const parts = pathname.split("/").filter((part) => part.length > 0);
  return parts[0];
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function isOperatorPath(pathname: string): boolean {
  if (pathname === "/operator" || pathname.startsWith("/operator/")) return true;
  if (pathname === "/api/operator" || pathname.startsWith("/api/operator/")) return true;
  const prefixed = `/${prefixedLocale}/operator`;
  return pathname === prefixed || pathname.startsWith(`${prefixed}/`);
}

function storageOrigin(): string {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) return "";
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

function supabaseOrigin(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function securityPolicy(nonce: string): string {
  const storage = storageOrigin();
  const project = supabaseOrigin();
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: blob: ${storage}`.trim(),
    `media-src 'self' ${storage}`.trim(),
    `connect-src 'self' ${project} ${storage}`.trim(),
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ]
    .join("; ")
    .replace(/ {2,}/g, " ");
}

function localeResponse(request: NextRequest, requestHeaders: Headers): NextResponse {
  const { pathname } = request.nextUrl;
  if (isApiPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const segment = firstSegment(pathname);
  if (segment === prefixedLocale) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (segment === defaultLocale) {
    const rest = pathname.slice(`/${defaultLocale}`.length);
    const destination = rest.length > 0 ? rest : "/";
    return NextResponse.redirect(new URL(destination, request.url), 308);
  }
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

async function operatorCookies(request: NextRequest, requestHeaders: Headers) {
  if (!isOperatorPath(request.nextUrl.pathname)) return [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  const stored: StoredCookie[] = [];
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          stored.push({ name, value, options });
        });
        const header = request.cookies
          .getAll()
          .map((entry) => `${entry.name}=${entry.value}`)
          .join("; ");
        if (header.length > 0) requestHeaders.set("cookie", header);
      },
    },
  });
  await supabase.auth.getClaims();
  return stored;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = securityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("Content-Security-Policy", policy);
  const stored = await operatorCookies(request, requestHeaders);
  const response = localeResponse(request, requestHeaders);
  for (const cookie of stored) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|.*\\..*).*)"],
};
