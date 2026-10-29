import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const origin = "http://localhost:3000";
const evidenceDir = path.join("docs", "evidence", "T03");
const shots = [
  { urlPath: "/", width: 390, height: 844, shotName: "home-ar-390.png" },
  { urlPath: "/", width: 1440, height: 900, shotName: "home-ar-1440.png" },
  { urlPath: "/en", width: 390, height: 844, shotName: "home-en-390.png" },
  { urlPath: "/en", width: 1440, height: 900, shotName: "home-en-1440.png" },
];
const headerTargets = [
  { method: "GET", urlPath: "/", expectStatus: 200 },
  { method: "GET", urlPath: "/en", expectStatus: 200 },
  { method: "GET", urlPath: "/operator/sign-in", expectStatus: 200 },
  { method: "GET", urlPath: "/en/operator/sign-in", expectStatus: 200 },
  { method: "GET", urlPath: "/api/operator/campaign-template", expectStatus: 401 },
  { method: "GET", urlPath: "/api/operator/campaign-export", expectStatus: 401 },
  { method: "POST", urlPath: "/api/operator/campaign-imports/preview", expectStatus: 401 },
  { method: "POST", urlPath: "/api/operator/campaign-imports/confirm", expectStatus: 401 },
  { method: "POST", urlPath: "/api/operator/campaign-banner/presign", expectStatus: 401 },
  { method: "POST", urlPath: "/api/operator/campaign-banner/finalise", expectStatus: 401 },
  { method: "POST", urlPath: "/api/operator/media-objects/presign", expectStatus: 401 },
  { method: "POST", urlPath: "/api/operator/media-objects/finalise", expectStatus: 401 },
];

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

fs.mkdirSync(evidenceDir, { recursive: true });
const browser = await chromium.launch();
const problems = [];
try {
  for (const shot of shots) {
    const context = await browser.newContext({ viewport: { width: shot.width, height: shot.height } });
    const page = await context.newPage();
    const response = await page.goto(`${origin}${shot.urlPath}`, { waitUntil: "networkidle" });
    const status = response ? response.status() : 0;
    if (status !== 200) problems.push(`${shot.urlPath} ${shot.width} status ${status}`);
    await page.screenshot({ path: path.join(evidenceDir, shot.shotName) });
    await context.close();
  }

  const headerContext = await browser.newContext();
  const headerRows = [];
  for (const target of headerTargets) {
    const response =
      target.method === "POST"
        ? await headerContext.request.post(`${origin}${target.urlPath}`, { data: {}, maxRedirects: 0 })
        : await headerContext.request.get(`${origin}${target.urlPath}`, { maxRedirects: 0 });
    const headers = redactHeaders(response.headers());
    headerRows.push({ url: `${origin}${target.urlPath}`, status: response.status(), headers });
    const policy = headers["content-security-policy"] ?? "";
    if (!policy.includes("nonce-")) problems.push(`${target.urlPath} missing nonce`);
    if (!policy.includes("frame-ancestors 'none'")) problems.push(`${target.urlPath} missing frame-ancestors`);
    if (!policy.includes("[redacted-project].r2.cloudflarestorage.com")) {
      problems.push(`${target.urlPath} missing storage host`);
    }
    const transport = headers["strict-transport-security"] ?? "";
    if (!transport.includes("max-age=63072000")) problems.push(`${target.urlPath} hsts`);
    if (headers["x-content-type-options"] !== "nosniff") problems.push(`${target.urlPath} nosniff`);
    if (headers["referrer-policy"] !== "strict-origin-when-cross-origin") problems.push(`${target.urlPath} referrer`);
    if (headers["permissions-policy"] !== "camera=(), microphone=(), geolocation=()") {
      problems.push(`${target.urlPath} permissions`);
    }
    if (operatorPath(target.urlPath)) {
      const cache = headers["cache-control"] ?? "";
      if (!cache.includes("no-store")) problems.push(`${target.urlPath} cache`);
      if (headers["x-robots-tag"] !== "noindex, nofollow") problems.push(`${target.urlPath} robots`);
    }
    if (response.status() !== target.expectStatus) problems.push(`${target.urlPath} status ${response.status()}`);
  }
  const serialised = `${JSON.stringify({ captures: headerRows }, null, 2)}\n`;
  if (/supabase\.co/i.test(serialised) || /[0-9a-f]{32}\.r2\.cloudflarestorage/i.test(serialised)) {
    problems.push("headers leaked a project reference");
  }
  fs.writeFileSync(path.join(evidenceDir, "headers.json"), serialised, "utf8");
  await headerContext.close();
} finally {
  await browser.close();
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
}
