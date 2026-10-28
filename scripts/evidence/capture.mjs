import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const origin = "http://localhost:3000";
const foundationDir = path.join("docs", "evidence", "T01");
const operatorDir = path.join("docs", "evidence", "T02");
const shots = [
  { urlPath: "/", width: 390, height: 844, shotName: "ar-390.png" },
  { urlPath: "/", width: 1440, height: 900, shotName: "ar-1440.png" },
  { urlPath: "/en", width: 390, height: 844, shotName: "en-390.png" },
  { urlPath: "/en", width: 1440, height: 900, shotName: "en-1440.png" },
];
const signShots = [
  { urlPath: "/operator/sign-in", width: 390, height: 844, shotName: "sign-in-ar-390.png" },
  { urlPath: "/operator/sign-in", width: 1440, height: 900, shotName: "sign-in-ar-1440.png" },
  { urlPath: "/en/operator/sign-in", width: 390, height: 844, shotName: "sign-in-en-390.png" },
  { urlPath: "/en/operator/sign-in", width: 1440, height: 900, shotName: "sign-in-en-1440.png" },
];
const headerTargets = [
  { method: "GET", urlPath: "/" },
  { method: "GET", urlPath: "/en" },
  { method: "GET", urlPath: "/operator/sign-in" },
  { method: "GET", urlPath: "/en/operator/sign-in" },
  { method: "POST", urlPath: "/api/operator/media-objects/presign" },
];

function locationPath(value) {
  if (value.startsWith("/")) return value.split("?")[0];
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

function redactValue(value) {
  return value
    .replace(/sb-[A-Za-z0-9_-]*auth-token/gi, "[redacted-secret]")
    .replace(/https:\/\/[a-z0-9]+\.supabase\.co/gi, "https://[redacted-project]")
    .replace(/[a-z0-9]{16,}\.r2\.cloudflarestorage\.com/gi, "[redacted-project].r2.cloudflarestorage.com")
    .replace(/supabase\.co/gi, "[redacted-project]");
}

function redactHeaders(raw) {
  const headers = {};
  for (const [key, value] of Object.entries(raw)) {
    headers[key] = key === "set-cookie" ? "[redacted-secret]" : redactValue(String(value));
  }
  return headers;
}

function operatorPath(urlPath) {
  return urlPath.includes("/operator");
}

fs.mkdirSync(foundationDir, { recursive: true });
fs.mkdirSync(operatorDir, { recursive: true });
const browser = await chromium.launch();
const problems = [];
try {
  const captures = [];
  for (const shot of shots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
    });
    const page = await context.newPage();
    const origins = new Set();
    page.on("request", (req) => {
      origins.add(new URL(req.url()).origin);
    });
    const response = await page.goto(`${origin}${shot.urlPath}`, { waitUntil: "networkidle" });
    const status = response ? response.status() : 0;
    const attrs = await page.locator("html").evaluate((el) => ({
      lang: el.getAttribute("lang"),
      dir: el.getAttribute("dir"),
      dataLocale: el.getAttribute("data-locale"),
    }));
    const cookies = await context.cookies();
    await page.screenshot({
      path: path.join(foundationDir, shot.shotName),
      fullPage: true,
    });
    captures.push({
      url: `${origin}${shot.urlPath}`,
      width: shot.width,
      height: shot.height,
      status,
      lang: attrs.lang,
      dir: attrs.dir,
      "data-locale": attrs.dataLocale,
      cookieCount: cookies.length,
      origins: [...origins].sort(),
    });
    await context.close();
  }

  const probe = await browser.newContext();
  const redirect = await probe.request.get(`${origin}/ar`, { maxRedirects: 0 });
  const location = redirect.headers().location ?? "";
  const report = {
    captures,
    arRedirect: {
      url: `${origin}/ar`,
      status: redirect.status(),
      location,
    },
  };
  fs.writeFileSync(
    path.join(foundationDir, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  await probe.close();

  for (const row of captures) {
    if (row.status !== 200) problems.push(`${row.url} ${row.width} status ${row.status}`);
    if (row.cookieCount !== 0) problems.push(`${row.url} ${row.width} cookies ${row.cookieCount}`);
    if (row.origins.length !== 1 || row.origins[0] !== origin) {
      problems.push(`${row.url} ${row.width} origins ${row.origins.join(",")}`);
    }
    const arabic = row.url === `${origin}/`;
    if (arabic && (row.lang !== "ar" || row.dir !== "rtl" || row["data-locale"] !== "ar")) {
      problems.push(`${row.url} ${row.width} locale ${row.lang}/${row.dir}/${row["data-locale"]}`);
    }
    if (!arabic && (row.lang !== "en" || row.dir !== "ltr" || row["data-locale"] !== "en")) {
      problems.push(`${row.url} ${row.width} locale ${row.lang}/${row.dir}/${row["data-locale"]}`);
    }
  }
  if (redirect.status() !== 308 || locationPath(location) !== "/") {
    problems.push(`/ar status ${redirect.status()} location ${location}`);
  }

  for (const shot of signShots) {
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
    });
    const page = await context.newPage();
    const response = await page.goto(`${origin}${shot.urlPath}`, { waitUntil: "networkidle" });
    const status = response ? response.status() : 0;
    if (status !== 200) problems.push(`${shot.urlPath} ${shot.width} status ${status}`);
    await page.screenshot({
      path: path.join(operatorDir, shot.shotName),
      fullPage: true,
    });
    await context.close();
  }

  const headerContext = await browser.newContext();
  const headerRows = [];
  for (const target of headerTargets) {
    const response =
      target.method === "POST"
        ? await headerContext.request.post(`${origin}${target.urlPath}`, {
            data: {},
            maxRedirects: 0,
          })
        : await headerContext.request.get(`${origin}${target.urlPath}`);
    const headers = redactHeaders(response.headers());
    headerRows.push({
      url: `${origin}${target.urlPath}`,
      status: response.status(),
      headers,
    });
    const policy = headers["content-security-policy"] ?? "";
    if (!policy.includes("nonce-")) problems.push(`${target.urlPath} missing nonce`);
    if (!policy.includes("frame-ancestors 'none'")) problems.push(`${target.urlPath} missing frame-ancestors`);
    if (!policy.includes("[redacted-project].r2.cloudflarestorage.com")) {
      problems.push(`${target.urlPath} missing storage host`);
    }
    const transport = headers["strict-transport-security"] ?? "";
    if (!transport.includes("max-age=63072000")) problems.push(`${target.urlPath} hsts`);
    if (/includeSubDomains/i.test(transport) || /preload/i.test(transport)) {
      problems.push(`${target.urlPath} hsts extra`);
    }
    if (headers["x-content-type-options"] !== "nosniff") problems.push(`${target.urlPath} nosniff`);
    if (headers["referrer-policy"] !== "strict-origin-when-cross-origin") {
      problems.push(`${target.urlPath} referrer`);
    }
    if (headers["permissions-policy"] !== "camera=(), microphone=(), geolocation=()") {
      problems.push(`${target.urlPath} permissions`);
    }
    if (operatorPath(target.urlPath)) {
      const cache = headers["cache-control"] ?? "";
      if (!cache.includes("no-store")) problems.push(`${target.urlPath} cache`);
      if (headers["x-robots-tag"] !== "noindex, nofollow") problems.push(`${target.urlPath} robots`);
    } else if (headers["set-cookie"]) {
      problems.push(`${target.urlPath} set-cookie`);
    }
    if (target.method === "POST" && response.status() !== 401) {
      problems.push(`${target.urlPath} status ${response.status()}`);
    }
    if (target.method === "GET" && response.status() !== 200) {
      problems.push(`${target.urlPath} status ${response.status()}`);
    }
  }
  const serialised = `${JSON.stringify({ captures: headerRows }, null, 2)}\n`;
  if (/supabase\.co/i.test(serialised) || /[0-9a-f]{32}\.r2\.cloudflarestorage/i.test(serialised)) {
    problems.push("headers leaked a project reference");
  }
  if (/sb-[A-Za-z0-9_-]*auth-token/i.test(serialised)) {
    problems.push("headers leaked a cookie name");
  }
  fs.writeFileSync(path.join(operatorDir, "headers.json"), serialised, "utf8");
  await headerContext.close();
} finally {
  await browser.close();
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
}
