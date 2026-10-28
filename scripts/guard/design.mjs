import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SKIP = new Set(["node_modules", ".next", "docs", "assets", ".git"]);
const VARIANT = "(?:[A-Za-z0-9_-]+:)*";
const EDGE = "(?:^|[\\s\"'`])";
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const SHADE = "50|100|200|300|400|500|600|700|800|900|950";
const UTILITY =
  "bg|text|border|fill|stroke|from|to|via|ring|outline|decoration|shadow|accent|caret|divide|placeholder";

function posix(value) {
  return value.split(path.sep).join("/");
}

function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

function eachMatch(text, pattern, rule, rel, findings) {
  const re = new RegExp(pattern, "g");
  let match;
  while ((match = re.exec(text))) {
    findings.push(`${rel}:${lineAt(text, match.index)}: rule ${rule}`);
  }
}

function isTarget(rel) {
  if (rel === "src/styles/tokens.css") return false;
  return /^src\/.*\.(?:ts|tsx|css)$/.test(rel);
}

function directionFindings(text, rel) {
  if (rel === "src/components/latin-run.tsx") return [];
  const findings = [];
  const tags = /<([A-Za-z][\w:-]*)\b([^<>]*)>/g;
  let tag;
  while ((tag = tags.exec(text))) {
    if (tag[1].toLowerCase() === "html") continue;
    const attribute = /(?:^|\s)dir\s*=/.exec(tag[2]);
    if (!attribute) continue;
    const at = tag.index + 1 + tag[1].length + attribute.index;
    findings.push(`${rel}:${lineAt(text, at)}: rule 4`);
  }
  return findings;
}

function findingsFor(rel, text) {
  const findings = [];
  const physical = [
    "\\bmargin-left\\b",
    "\\bmargin-right\\b",
    "\\bpadding-left\\b",
    "\\bpadding-right\\b",
    "(?:^|[^-A-Za-z0-9_])left\\s*:",
    "(?:^|[^-A-Za-z0-9_])right\\s*:",
    "\\bborder-left\\b",
    "\\bborder-right\\b",
    "\\btext-align\\s*:\\s*left\\b",
    "\\btext-align\\s*:\\s*right\\b",
    "\\bfloat\\s*:\\s*left\\b",
    "\\bfloat\\s*:\\s*right\\b",
    `${EDGE}${VARIANT}(?:ml|mr|pl|pr)-[^\\s\"'\`]+`,
    `${EDGE}${VARIANT}(?:left|right)-[^\\s\"'\`]+`,
    `${EDGE}${VARIANT}text-left\\b`,
    `${EDGE}${VARIANT}text-right\\b`,
    `${EDGE}${VARIANT}border-l(?![A-Za-z])`,
    `${EDGE}${VARIANT}border-r(?![A-Za-z])`,
    `${EDGE}${VARIANT}rounded-l(?![A-Za-z])`,
    `${EDGE}${VARIANT}rounded-r(?![A-Za-z])`,
    "\\b(?:margin|padding|border)(?:Left|Right)[A-Za-z]*\\b",
    "\\btextAlign\\s*:\\s*['\"](?:left|right)['\"]",
    "\\bfloat\\s*:\\s*['\"](?:left|right)['\"]",
  ];
  for (const pattern of physical) eachMatch(text, pattern, 1, rel, findings);
  eachMatch(text, "#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b", 2, rel, findings);
  eachMatch(text, "\\b(?:rgb|rgba|hsl|hsla)\\s*\\(", 2, rel, findings);
  eachMatch(
    text,
    `${EDGE}${VARIANT}(?:${UTILITY})-(?:${PALETTE})-(?:${SHADE})\\b`,
    2,
    rel,
    findings,
  );
  eachMatch(
    text,
    `${EDGE}${VARIANT}(?:${UTILITY})-(?:black|white)\\b`,
    2,
    rel,
    findings,
  );
  if (rel !== "src/styles/fonts.css") {
    const family = /font-family\s*:/.exec(text);
    if (family) findings.push(`${rel}:${lineAt(text, family.index)}: rule 3`);
  }
  findings.push(...directionFindings(text, rel));
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
    { expect: "fail", path: "src/pane.css", text: ".pane { margin-left: 0; }\n" },
    { expect: "fail", path: "src/pane.tsx", text: 'export const pane = "ml-4";\n' },
    { expect: "fail", path: "src/swatch.css", text: ".swatch { color: #fff; }\n" },
    { expect: "fail", path: "src/other.css", text: 'p { font-family: "Demo"; }\n' },
    { expect: "fail", path: "src/widget.tsx", text: '<div dir="ltr"></div>\n' },
    {
      expect: "fail",
      path: "src/offset.tsx",
      text: "export const pane = <div style={{ marginLeft: 4 }} />;\n",
    },
    {
      expect: "fail",
      path: "src/pair.tsx",
      text: "export const pane = <div style={{ marginLeft: 1, paddingRight: 2 }} />;\n",
      min: 2,
    },
    { expect: "pass", path: "src/logical.tsx", text: 'export const pane = "ps-4 text-start";\n' },
    { expect: "pass", path: "src/binding.ts", text: "const dir = x;\n" },
    {
      expect: "pass",
      path: "src/tone.css",
      text: "body { background: var(--nel-color-background); color: var(--nel-color-text); }\n",
    },
    {
      expect: "pass",
      path: "src/styles/fonts.css",
      text: 'body { font-family: "IBM Plex Sans Arabic", sans-serif; }\n',
    },
    { expect: "pass", path: "src/app/shell.tsx", text: '<html dir="ltr"></html>\n' },
  ];
  const failSamples = samples.filter((sample) => sample.expect === "fail");
  const passSamples = samples.filter((sample) => sample.expect === "pass");

  function count(group, mode) {
    let hits = 0;
    for (const sample of group) {
      let findings;
      if (mode === "string") findings = findingsFor(sample.path, sample.text);
      else {
        const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nelo-design-"));
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
    `SELF-CHECK design string: fail ${stringFail}/${failSamples.length} pass ${stringPass}/${passSamples.length} · file: fail ${diskFail}/${failSamples.length} pass ${diskPass}/${passSamples.length}`,
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
