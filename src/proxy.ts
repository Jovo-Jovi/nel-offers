import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, localeFromPathname } from "./i18n/config";
import { readVisibleCampaignOffer } from "./lib/public-query";
import { codePattern } from "./lib/sheet-format";
import { createPublicClient } from "./lib/supabase/public";

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
  if (pathname === "/api/operator" || pathname.startsWith("/api/operator/")) return true;
  const parts = pathname.split("/").filter((part) => part.length > 0);
  if (!parts[0] || !isLocale(parts[0])) return false;
  return parts[1] === "operator";
}

function dashboardTarget(pathname: string): string | null {
  if (pathname === "/dashboard") return `/${defaultLocale}/operator/overview`;
  const parts = pathname.split("/").filter((part) => part.length > 0);
  if (parts.length === 2 && isLocale(parts[0]) && parts[1] === "dashboard") {
    return `/${parts[0]}/operator/overview`;
  }
  return null;
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

function restPath(pathname: string): string {
  const segment = firstSegment(pathname);
  if (!segment || !isLocale(segment)) return pathname;
  const rest = pathname.slice(`/${segment}`.length);
  return rest.length > 0 ? rest : "/";
}

function campaignCode(rest: string): string | null {
  const parts = rest.split("/").filter((part) => part.length > 0);
  if (parts.length !== 2 || parts[0] !== "campaign-offers") return null;
  const code = parts[1];
  if (!code || !codePattern.test(code)) return null;
  return code;
}

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url), 307);
}

// loading.tsx streams a 200 before notFound() can set the status. The read uses RLS only.
async function routeResponse(request: NextRequest, requestHeaders: Headers): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (isApiPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const dashboard = dashboardTarget(pathname);
  if (dashboard) return redirectTo(request, dashboard);
  const segment = firstSegment(pathname);
  if (!segment || !isLocale(segment)) {
    const destination = pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
    return redirectTo(request, destination);
  }
  const rest = restPath(pathname);
  const operator = rest === "/operator" || rest.startsWith("/operator/");
  const known = rest === "/" || rest === "/missing" || operator;
  if (!known) {
    const code = campaignCode(rest);
    const visible = code ? await readVisibleCampaignOffer(createPublicClient(), code) : null;
    if (!code || !visible) {
      requestHeaders.set("x-not-found", code ? "campaign-offer" : "page");
      const url = request.nextUrl.clone();
      url.pathname = `/${localeFromPathname(pathname)}/missing`;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
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
  const response = await routeResponse(request, requestHeaders);
  for (const cookie of stored) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|.*\\..*).*)"],
};
