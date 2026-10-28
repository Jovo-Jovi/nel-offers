import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const origin = "http://localhost:3000";
const outDir = path.join("docs", "evidence", "T01");
const shots = [
  { urlPath: "/", width: 390, height: 844, shotName: "ar-390.png" },
  { urlPath: "/", width: 1440, height: 900, shotName: "ar-1440.png" },
  { urlPath: "/en", width: 390, height: 844, shotName: "en-390.png" },
  { urlPath: "/en", width: 1440, height: 900, shotName: "en-1440.png" },
];

function locationPath(value) {
  if (value.startsWith("/")) return value.split("?")[0];
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const captures = [];
try {
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
      path: path.join(outDir, shot.shotName),
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
  fs.writeFileSync(path.join(outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await probe.close();

  const problems = [];
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
  if (problems.length > 0) {
    for (const problem of problems) console.error(problem);
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
