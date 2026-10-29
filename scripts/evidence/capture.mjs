import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const origin = "http://localhost:3000";
const evidenceDir = path.join("docs", "evidence", "T04-F2");
const headerTargets = [
  { urlPath: "/", expectStatus: 307, operator: false },
  { urlPath: "/ar", expectStatus: 200, operator: false },
  { urlPath: "/en", expectStatus: 200, operator: false },
  { urlPath: "/dashboard", expectStatus: 307, operator: false },
  { urlPath: "/ar/operator/sign-in", expectStatus: 200, operator: true },
  { urlPath: "/ar/nope", expectStatus: 404, operator: false },
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

fs.mkdirSync(evidenceDir, { recursive: true });
const browser = await chromium.launch();
const problems = [];
try {
  const headerContext = await browser.newContext();
  const headerRows = [];
  for (const target of headerTargets) {
    const response = await headerContext.request.get(`${origin}${target.urlPath}`, { maxRedirects: 0 });
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
    if (response.status() !== target.expectStatus) problems.push(`${target.urlPath} status ${response.status()}`);
    if (target.operator) {
      if (!(headers["cache-control"] ?? "").includes("no-store")) problems.push(`${target.urlPath} no-store`);
      if (headers["x-robots-tag"] !== "noindex, nofollow") problems.push(`${target.urlPath} robots`);
    }
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
