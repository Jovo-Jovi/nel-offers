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
  const re = /"([^"]+)"|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let match;
  while ((match = re.exec(text))) {
    const name = match[1] ?? match[2];
    const line = text.slice(0, match.index).split("\n").length;
    found.push({ name, line });
  }
  return found;
}

function scanRoot(root) {
  const findings = [];

  function consider(name, rel, line) {
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
      const parseSql =
        rel.startsWith("supabase/migrations/") && entry.name.endsWith(".sql");
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
  const mustFail = ["campaignOfferItem", "mediaObjectFile"];
  const mustPass = ["campaignOfferId", "uploadCandidate", "mediaObjectId"];

  function count(names, expectReject, mode) {
    let hits = 0;
    for (const name of names) {
      let rejected;
      if (mode === "string") rejected = nameRejected(name);
      else {
        const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nelo-naming-"));
        const dest = path.join(scratch, "src", "sample.mjs");
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, `export const ${name} = 1;\n`, "utf8");
        rejected = scanRoot(scratch).length > 0;
        fs.rmSync(scratch, { recursive: true, force: true });
      }
      if (expectReject ? rejected : !rejected) hits += 1;
    }
    return hits;
  }

  const stringFail = count(mustFail, true, "string");
  const stringPass = count(mustPass, false, "string");
  const diskFail = count(mustFail, true, "disk");
  const diskPass = count(mustPass, false, "disk");
  console.log(
    `SELF-CHECK naming string: fail ${stringFail}/${mustFail.length} pass ${stringPass}/${mustPass.length} · file: fail ${diskFail}/${mustFail.length} pass ${diskPass}/${mustPass.length}`,
  );
  if (
    stringFail !== mustFail.length ||
    stringPass !== mustPass.length ||
    diskFail !== mustFail.length ||
    diskPass !== mustPass.length
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
