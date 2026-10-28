import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SKIP = new Set(["node_modules", ".next", "docs", "assets", ".git"]);
const DENIED = new Set([
  "@vercel/analytics",
  "@vercel/speed-insights",
  "posthog-js",
  "posthog-node",
  "@sentry/nextjs",
  "@sentry/node",
  "mixpanel-browser",
  "@segment/analytics-next",
  "react-ga4",
  "@hotjar/browser",
]);
const COLUMN_WORDS = new Set([
  "email",
  "phone",
  "mobile",
  "name",
  "address",
  "birth",
  "national",
  "ip",
  "filename",
  "original",
]);
const COLUMN_EXCEPTIONS = new Set(["name_ar", "name_en"]);

function posix(value) {
  return value.split(path.sep).join("/");
}

function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

function isPublicApp(rel) {
  return rel.startsWith("src/app/") && !rel.split("/").includes("operator");
}

function publicFindings(rel, text) {
  if (!isPublicApp(rel)) return [];
  const findings = [];
  const patterns = [
    [/<form\b/i, 1],
    [/["']use server["']/, 1],
    [/\bcookies\s*\(/, 1],
    [/\bsearchParams\b/, 1],
  ];
  for (const [re, rule] of patterns) {
    const match = re.exec(text);
    if (match) findings.push(`${rel}:${lineAt(text, match.index)}: rule ${rule}`);
  }
  if (/\/route\.tsx?$/.test(rel)) {
    const exported =
      /\bexport\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH|DELETE)\b/.exec(text) ??
      /\bexport\s+(?:const|let|var)\s+(?:POST|PUT|PATCH|DELETE)\b/.exec(text);
    if (exported) findings.push(`${rel}:${lineAt(text, exported.index)}: rule 1`);
  }
  return findings;
}

function packageFindings(rel, text) {
  if (rel !== "package.json") return [];
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [`${rel}:1: rule 2`];
  }
  const findings = [];
  for (const group of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const block = parsed[group];
    if (!block || typeof block !== "object") continue;
    for (const packageName of Object.keys(block)) {
      if (!DENIED.has(packageName)) continue;
      const index = text.indexOf(`"${packageName}"`);
      findings.push(`${rel}:${index >= 0 ? lineAt(text, index) : 1}: rule 2`);
    }
  }
  return findings;
}

function consoleFindings(rel, text) {
  if (!rel.startsWith("src/")) return [];
  const findings = [];
  const re = /console\.(log|info|debug|error|warn)\s*\(/g;
  let match;
  while ((match = re.exec(text))) {
    const method = match[1];
    if (method === "log" || method === "info" || method === "debug") {
      findings.push(`${rel}:${lineAt(text, match.index)}: rule 3`);
      continue;
    }
    const rest = text.slice(match.index + match[0].length);
    if (!/^\s*(?:`[^`$]*`|"[^"\n]*"|'[^'\n]*')/.test(rest)) {
      findings.push(`${rel}:${lineAt(text, match.index)}: rule 3`);
    }
  }
  return findings;
}

function columnFindings(rel, text) {
  if (!rel.startsWith("supabase/migrations/") || !rel.endsWith(".sql")) return [];
  const findings = [];
  const re = /"([^"]+)"|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let match;
  while ((match = re.exec(text))) {
    const ident = match[1] ?? match[2];
    if (COLUMN_EXCEPTIONS.has(ident)) continue;
    const words = ident.split("_").map((word) => word.toLowerCase());
    if (words.some((word) => COLUMN_WORDS.has(word))) {
      findings.push(`${rel}:${lineAt(text, match.index)}: rule 4`);
    }
  }
  return findings;
}

function findingsFor(rel, text) {
  return [
    ...publicFindings(rel, text),
    ...packageFindings(rel, text),
    ...consoleFindings(rel, text),
    ...columnFindings(rel, text),
  ];
}

function scanRoot(root) {
  const findings = [];
  const packagePath = path.join(root, "package.json");
  if (fs.existsSync(packagePath)) {
    findings.push(...findingsFor("package.json", fs.readFileSync(packagePath, "utf8")));
  }
  function walk(absDir) {
    if (!fs.existsSync(absDir)) return;
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      const rel = posix(path.relative(root, abs));
      findings.push(...findingsFor(rel, fs.readFileSync(abs, "utf8")));
    }
  }
  walk(path.join(root, "src"));
  walk(path.join(root, "supabase"));
  return findings;
}

function runSelfCheck() {
  const samples = [
    { expect: "fail", path: "src/app/page.tsx", text: "export const pane = <form></form>;\n" },
    {
      expect: "fail",
      path: "package.json",
      text: '{"dependencies":{"@vercel/analytics":"1.0.0"}}\n',
    },
    { expect: "fail", path: "src/debug.ts", text: 'console.log("x");\n' },
    {
      expect: "fail",
      path: "supabase/migrations/001.sql",
      text: "create table holder (\n  email text\n);\n",
    },
    { expect: "pass", path: "src/app/page.tsx", text: 'export const pane = "ready";\n' },
    { expect: "pass", path: "package.json", text: '{"dependencies":{"next":"16.4.3"}}\n' },
    { expect: "pass", path: "src/debug.ts", text: 'console.error("code");\n' },
    {
      expect: "pass",
      path: "supabase/migrations/001.sql",
      text: "create table holder (\n  name_ar text,\n  name_en text\n);\n",
    },
  ];
  const failSamples = samples.filter((sample) => sample.expect === "fail");
  const passSamples = samples.filter((sample) => sample.expect === "pass");

  function count(group, mode) {
    let hits = 0;
    for (const sample of group) {
      let flagged;
      if (mode === "string") flagged = findingsFor(sample.path, sample.text).length > 0;
      else {
        const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nelo-boundary-"));
        const dest = path.join(scratch, ...sample.path.split("/"));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, sample.text, "utf8");
        flagged = scanRoot(scratch).length > 0;
        fs.rmSync(scratch, { recursive: true, force: true });
      }
      if ((sample.expect === "fail") === flagged) hits += 1;
    }
    return hits;
  }

  const stringFail = count(failSamples, "string");
  const stringPass = count(passSamples, "string");
  const diskFail = count(failSamples, "disk");
  const diskPass = count(passSamples, "disk");
  console.log(
    `SELF-CHECK boundary string: fail ${stringFail}/${failSamples.length} pass ${stringPass}/${passSamples.length} · file: fail ${diskFail}/${failSamples.length} pass ${diskPass}/${passSamples.length}`,
  );
  if (
    stringFail !== failSamples.length ||
    stringPass !== passSamples.length ||
    diskFail !== failSamples.length ||
    diskPass !== passSamples.length
  ) {
    process.exitCode = 1;
  }
}

if (process.argv.includes("--self-check")) runSelfCheck();
else {
  const findings = scanRoot(process.cwd());
  for (const finding of findings) console.log(finding);
  if (findings.length > 0) process.exitCode = 1;
}
