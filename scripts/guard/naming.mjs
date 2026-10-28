import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const SKIP = new Set(["node_modules", ".next", "docs", "assets", ".git"]);
const ROOTS = ["src", "supabase", "scripts", "e2e"];
const COMPOUNDS = [
  ["campaign", "offer", "media"],
  ["campaign", "offer"],
  ["media", "object"],
  ["content", "type"],
];
// UNRATIFIED: the T02 fence mandates these filenames; each contains the bare word media.
const FENCE_FILENAMES = new Set(["media-name.ts", "media-limits.ts"]);
const FORBIDDEN = [
  "test",
  "result",
  "patient",
  "offer",
  "item",
  "content",
  "user",
  "admin",
  "file",
  "media",
];

function posix(value) {
  return value.split(path.sep).join("/");
}

function splitWords(name) {
  const spaced = name
    .replace(/[[\]]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[._\-/\\]+/g, " ");
  return spaced
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());
}

function wordMatches(actual, expected, plural) {
  if (actual === expected) return true;
  if (plural && actual === `${expected}s`) return true;
  return false;
}

function stripCompounds(words) {
  const kept = [];
  let index = 0;
  while (index < words.length) {
    let consumed = 0;
    for (const compound of COMPOUNDS) {
      if (index + compound.length > words.length) continue;
      let matched = true;
      for (let offset = 0; offset < compound.length; offset += 1) {
        const last = offset === compound.length - 1;
        if (!wordMatches(words[index + offset], compound[offset], last)) {
          matched = false;
          break;
        }
      }
      if (matched) {
        consumed = compound.length;
        break;
      }
    }
    if (consumed > 0) index += consumed;
    else {
      kept.push(words[index]);
      index += 1;
    }
  }
  return kept;
}

function nameRejected(name) {
  const words = stripCompounds(splitWords(name));
  return words.some((word) =>
    FORBIDDEN.some((banned) => word === banned || word === `${banned}s`),
  );
}

function insideCall(node) {
  let current = node.parent;
  while (current) {
    if (ts.isCallExpression(current) || ts.isNewExpression(current)) {
      for (const arg of current.arguments ?? []) {
        let probe = node;
        while (probe) {
          if (probe === arg) return true;
          probe = probe.parent;
        }
      }
    }
    current = current.parent;
  }
  return false;
}

function declaredNames(text, sourceName) {
  const kind = sourceName.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : sourceName.endsWith(".ts")
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JS;
  const source = ts.createSourceFile(
    sourceName,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const found = [];

  function addNode(node) {
    if (!node || !ts.isIdentifier(node)) return;
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    found.push({ name: node.text, line });
  }

  function addText(name, node) {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    found.push({ name, line });
  }

  function addPropertyName(node) {
    if (!node.name) return;
    if (ts.isIdentifier(node.name)) addNode(node.name);
    else if (ts.isStringLiteral(node.name) || ts.isNumericLiteral(node.name)) {
      addText(node.name.text, node.name);
    }
  }

  function visitBinding(name) {
    if (!name) return;
    if (ts.isIdentifier(name)) addNode(name);
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) visitBinding(element.name);
      }
    }
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && node.importClause) {
      const clause = node.importClause;
      addNode(clause.name);
      const bindings = clause.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) addNode(bindings.name);
      if (bindings && ts.isNamedImports(bindings)) {
        for (const spec of bindings.elements) addNode(spec.name);
      }
    }
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node)
    ) {
      addNode(node.name);
    }
    if (ts.isVariableDeclaration(node)) visitBinding(node.name);
    if (ts.isParameter(node)) visitBinding(node.name);
    if (ts.isEnumMember(node)) addPropertyName(node);
    if (
      ts.isPropertyDeclaration(node) ||
      ts.isPropertySignature(node) ||
      ts.isMethodSignature(node)
    ) {
      addPropertyName(node);
    }
    if (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) {
      if (!insideCall(node)) addPropertyName(node);
    }
    if (ts.isMethodDeclaration(node)) {
      const inObject = node.parent && ts.isObjectLiteralExpression(node.parent);
      if (!inObject || !insideCall(node)) addPropertyName(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return found;
}

function sqlNames(text) {
  const found = [];
  const length = text.length;
  let index = 0;
  let line = 1;
  let previous = "";
  let dotted = false;

  function consume(next) {
    while (index < next) {
      if (text[index] === "\n") line += 1;
      index += 1;
    }
  }

  while (index < length) {
    const char = text[index];
    if (char === "-" && text[index + 1] === "-") {
      const end = text.indexOf("\n", index);
      consume(end === -1 ? length : end + 1);
      previous = "";
      dotted = false;
      continue;
    }
    if (char === "/" && text[index + 1] === "*") {
      const end = text.indexOf("*/", index + 2);
      consume(end === -1 ? length : end + 2);
      previous = "";
      dotted = false;
      continue;
    }
    if (char === "'") {
      index += 1;
      while (index < length) {
        if (text[index] === "'" && text[index + 1] === "'") {
          index += 2;
          continue;
        }
        if (text[index] === "'") {
          index += 1;
          break;
        }
        if (text[index] === "\n") line += 1;
        index += 1;
      }
      previous = "";
      dotted = false;
      continue;
    }
    if (char === '"') {
      const startLine = line;
      index += 1;
      let name = "";
      while (index < length) {
        if (text[index] === '"' && text[index + 1] === '"') {
          name += '"';
          index += 2;
          continue;
        }
        if (text[index] === '"') {
          index += 1;
          break;
        }
        if (text[index] === "\n") line += 1;
        name += text[index];
        index += 1;
      }
      const qualified = dotted && previous === "auth";
      dotted = false;
      if (!qualified) found.push({ name, line: startLine });
      previous = name.toLowerCase();
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const start = index;
      const startLine = line;
      index += 1;
      while (index < length && /[A-Za-z0-9_]/.test(text[index])) index += 1;
      const name = text.slice(start, index);
      const qualified = dotted && previous === "auth";
      dotted = false;
      if (!qualified) found.push({ name, line: startLine });
      previous = name.toLowerCase();
      continue;
    }
    if (char === "." && previous.length > 0) {
      dotted = true;
      index += 1;
      continue;
    }
    if (char === "\n") line += 1;
    if (!/\s/.test(char)) {
      previous = "";
      dotted = false;
    }
    index += 1;
  }
  return found;
}

function scanRoot(root) {
  const findings = [];

  function consider(name, rel, line) {
    if (FENCE_FILENAMES.has(name)) return;
    if (nameRejected(name)) findings.push(`${rel}:${line}: rule ${name}`);
  }

  function walk(absDir) {
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const abs = path.join(absDir, entry.name);
      const rel = posix(path.relative(root, abs));
      if (entry.isDirectory()) {
        consider(entry.name, rel, 1);
        walk(abs);
        continue;
      }
      consider(entry.name, rel, 1);
      const parseSource = /\.(tsx?|mjs)$/.test(entry.name);
      const parseSql = rel.startsWith("supabase/") && entry.name.endsWith(".sql");
      if (!parseSource && !parseSql) continue;
      const text = fs.readFileSync(abs, "utf8");
      const declared = parseSource ? declaredNames(text, entry.name) : sqlNames(text);
      for (const declaredName of declared) {
        if (nameRejected(declaredName.name)) {
          findings.push(`${rel}:${declaredName.line}: rule ${declaredName.name}`);
        }
      }
    }
  }

  for (const folder of ROOTS) {
    const abs = path.join(root, folder);
    if (fs.existsSync(abs)) walk(abs);
  }
  return findings;
}

function runSelfCheck() {
  const samples = [
    { expect: "fail", kind: "identifier", name: "campaignOfferItem" },
    { expect: "fail", kind: "identifier", name: "mediaObjectFile" },
    { expect: "pass", kind: "identifier", name: "campaignOfferId" },
    { expect: "pass", kind: "identifier", name: "uploadCandidate" },
    { expect: "pass", kind: "identifier", name: "mediaObjectId" },
    { expect: "pass", kind: "sql", text: "-- offer\n/* file */\nselect 1;\n" },
    { expect: "pass", kind: "sql", text: "select 'user file offer';\n" },
    { expect: "pass", kind: "sql", text: "references auth.users (id)\n" },
    { expect: "fail", kind: "sql", text: 'create table public."Offer" (id int);\n' },
    {
      expect: "fail",
      kind: "sql",
      min: 2,
      text: 'create table public."Offer" (id int);\ncreate table public."File" (id int);\n',
    },
  ];
  const failSamples = samples.filter((sample) => sample.expect === "fail");
  const passSamples = samples.filter((sample) => sample.expect === "pass");

  function findingsFor(sample, mode) {
    if (mode === "string") {
      if (sample.kind === "sql") {
        return sqlNames(sample.text).filter((found) => nameRejected(found.name));
      }
      return nameRejected(sample.name) ? [sample.name] : [];
    }
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nelo-naming-"));
    try {
      if (sample.kind === "sql") {
        const dest = path.join(scratch, "supabase", "hold.sql");
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, sample.text, "utf8");
      } else {
        const dest = path.join(scratch, "src", "sample.mjs");
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, `export const ${sample.name} = 1;\n`, "utf8");
      }
      return scanRoot(scratch);
    } finally {
      fs.rmSync(scratch, { recursive: true, force: true });
    }
  }

  function count(group, mode) {
    let hits = 0;
    for (const sample of group) {
      const findings = findingsFor(sample, mode);
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
    `SELF-CHECK naming string: fail ${stringFail}/${failSamples.length} pass ${stringPass}/${passSamples.length} · file: fail ${diskFail}/${failSamples.length} pass ${diskPass}/${passSamples.length}`,
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

if (process.argv.includes("--self-check")) {
  runSelfCheck();
} else {
  const findings = scanRoot(process.cwd());
  for (const finding of findings) console.log(finding);
  if (findings.length > 0) process.exitCode = 1;
}
