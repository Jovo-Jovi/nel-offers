import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const SKIP = new Set(["node_modules", ".next", "docs", "assets", ".git"]);
const LOCALE_WORDS = new Set(["ar", "en", "rtl", "ltr"]);

function posix(value) {
  return value.split(path.sep).join("/");
}

function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

function isTarget(rel) {
  if (rel === "src/styles/tokens.css") return false;
  return /^src\/.*\.(?:ts|tsx|css)$/.test(rel);
}

function isCatalogue(rel) {
  return rel === "src/i18n/ar.ts" || rel === "src/i18n/en.ts";
}

function stringLiterals(text, sourceName) {
  const kind = sourceName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    sourceName,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const values = [];
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      values.push({ value: node.text, index: node.getStart(source) });
    } else if (
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      if (node.text.length > 0) values.push({ value: node.text, index: node.getStart(source) });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return values;
}

function pushMatches(findings, rel, text, pattern, flags, rule) {
  const re = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  let match;
  while ((match = re.exec(text))) {
    findings.push(`${rel}:${lineAt(text, match.index)}: rule ${rule}`);
    if (match[0].length === 0) re.lastIndex += 1;
  }
}

function findingsFor(rel, text) {
  const findings = [];
  if (!isTarget(rel)) return findings;
  const code = /\.(?:ts|tsx|css)$/.test(rel);
  if (code) {
    pushMatches(findings, rel, text, "wa\\.me\\/[0-9+]", "g", 1);
    pushMatches(findings, rel, text, "tel:[0-9+]", "g", 1);
    pushMatches(findings, rel, text, "nileegyptlabs", "gi", 2);
    pushMatches(findings, rel, text, "\\d{5,}", "g", 3);
    pushMatches(findings, rel, text, "20\\d\\d-[01]\\d-[0-3]\\d", "g", 4);
  }
  if (isCatalogue(rel)) {
    pushMatches(findings, rel, text, "\\d{3,}", "g", 5);
  }
  if (/\.(?:ts|tsx)$/.test(rel) && rel !== "src/i18n/config.ts") {
    for (const literal of stringLiterals(text, rel)) {
      if (LOCALE_WORDS.has(literal.value)) {
        findings.push(`${rel}:${lineAt(text, literal.index)}: rule 6`);
      }
    }
  }
  return findings;
}

function scanRoot(root) {
  const findings = [];
  function walk(absDir) {
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      const rel = posix(path.relative(root, abs));
      if (!isTarget(rel)) continue;
      findings.push(...findingsFor(rel, fs.readFileSync(abs, "utf8")));
    }
  }
  const src = path.join(root, "src");
  if (fs.existsSync(src)) walk(src);
  return findings;
}

function runSelfCheck() {
  const samples = [
    { expect: "fail", path: "src/link.ts", text: 'export const link = "tel:+20";\n' },
    { expect: "fail", path: "src/host.ts", text: 'export const host = "nileegyptlabs";\n' },
    { expect: "fail", path: "src/wide.ts", text: "export const wide = 10000;\n" },
    { expect: "fail", path: "src/day.ts", text: 'export const day = "2026-01-02";\n' },
    {
      expect: "fail",
      path: "src/i18n/ar.ts",
      text: 'export const catalogue = { home: { comingSoon: "100" } };\n',
    },
    { expect: "fail", path: "src/proxy.ts", text: 'export const code = "en";\n' },
    {
      expect: "fail",
      path: "src/pair.ts",
      text: "export const wide = 10000;\nexport const wider = 20000;\n",
      min: 2,
    },
    { expect: "pass", path: "src/plain.ts", text: 'export const label = "hello";\n' },
    { expect: "pass", path: "src/scale.ts", text: "export const byteLimit = 100 * 1024;\n" },
    { expect: "pass", path: "src/i18n/config.ts", text: 'export const code = "ar";\n' },
  ];
  const failSamples = samples.filter((sample) => sample.expect === "fail");
  const passSamples = samples.filter((sample) => sample.expect === "pass");

  function count(group, mode) {
    let hits = 0;
    for (const sample of group) {
      let findings;
      if (mode === "string") findings = findingsFor(sample.path, sample.text);
      else {
        const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nelo-literals-"));
        const dest = path.join(scratch, ...sample.path.split("/"));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, sample.text, "utf8");
        findings = scanRoot(scratch);
        fs.rmSync(scratch, { recursive: true, force: true });
      }
      const ok =
        typeof sample.min === "number"
          ? findings.length >= sample.min
          : (findings.length > 0) === (sample.expect === "fail");
      if (ok) hits += 1;
    }
    return hits;
  }

  const stringFail = count(failSamples, "string");
  const stringPass = count(passSamples, "string");
  const diskFail = count(failSamples, "disk");
  const diskPass = count(passSamples, "disk");
  console.log(
    `SELF-CHECK literals string: fail ${stringFail}/${failSamples.length} pass ${stringPass}/${passSamples.length} · file: fail ${diskFail}/${failSamples.length} pass ${diskPass}/${passSamples.length}`,
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
