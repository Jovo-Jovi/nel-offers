import fs from "node:fs";
import path from "node:path";

const ledgerPath = path.join("docs", "usage", "runs.jsonl");
const stages = new Set(["blueprint", "builder", "reviewer", "review-gate"]);
const sources = new Set(["tool-report", "session-records", "not-reported"]);
const taskPattern = /^(?:blueprint|go-live|T0[1-4](?:-F\d*)?)$/;
const runAtPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const toolPattern = /^[a-z0-9-]+$/;
const modelPattern = /^[A-Za-z0-9._:-]+$/;
const allowed = new Set([
  "run-at",
  "tool",
  "model",
  "stage",
  "task",
  "input",
  "output",
  "cache-read",
  "cache-write",
  "cost-usd",
  "source",
  "note",
]);
const tokenNames = ["input", "output", "cache-read", "cache-write"];

function fail(message) {
  console.error(message);
  process.exit(1);
}

const argv = process.argv.slice(2);
const flags = new Map();
let notReported = false;
for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (token === "--not-reported") {
    if (notReported) fail("duplicate --not-reported");
    notReported = true;
    continue;
  }
  if (!token.startsWith("--")) fail(`unknown argument ${token}`);
  const flagName = token.slice(2);
  const flagValue = argv[index + 1];
  if (flagValue === undefined || flagValue.startsWith("--")) fail(`missing value for ${token}`);
  if (flags.has(flagName)) fail(`duplicate --${flagName}`);
  if (!allowed.has(flagName)) fail(`unknown flag --${flagName}`);
  flags.set(flagName, flagValue);
  index += 1;
}

function required(flagName) {
  const flagValue = flags.get(flagName);
  if (flagValue === undefined) fail(`missing --${flagName}`);
  return flagValue;
}

const runAt = required("run-at");
if (!runAtPattern.test(runAt) || Number.isNaN(Date.parse(runAt))) fail("invalid --run-at");

const tool = required("tool");
if (!toolPattern.test(tool)) fail("invalid --tool");

const model = required("model");
if (!modelPattern.test(model)) fail("invalid --model");

const stage = required("stage");
if (!stages.has(stage)) fail("invalid --stage");

const task = required("task");
if (!taskPattern.test(task)) fail("invalid --task");

const source = required("source");
if (!sources.has(source)) fail("invalid --source");

function readToken(flagName) {
  const raw = required(flagName);
  if (!/^\d+$/.test(raw)) fail(`invalid --${flagName}`);
  return Number(raw);
}

let input;
let output;
let cacheRead;
let cacheWrite;
if (notReported) {
  for (const flagName of tokenNames) {
    if (flags.has(flagName)) fail(`--${flagName} cannot be combined with --not-reported`);
  }
  if (source !== "not-reported") fail("--source must be not-reported");
  input = null;
  output = null;
  cacheRead = null;
  cacheWrite = null;
} else {
  if (source === "not-reported") fail("token flags are required unless --not-reported");
  input = readToken("input");
  output = readToken("output");
  cacheRead = readToken("cache-read");
  cacheWrite = readToken("cache-write");
}

let cost = null;
if (flags.has("cost-usd")) {
  const raw = flags.get("cost-usd");
  if (!/^\d+(?:\.\d+)?$/.test(raw)) fail("invalid --cost-usd");
  cost = Number(raw);
}

let note;
if (flags.has("note")) {
  note = flags.get("note");
  if (note.length > 120 || note.includes("\n") || note.includes("@")) fail("invalid --note");
}

const row = {
  run_at: runAt,
  tool,
  model,
  stage,
  task,
  input,
  output,
  cache_read: cacheRead,
  cache_write: cacheWrite,
  cost_usd: cost,
  source,
};
if (note !== undefined) row.note = note;

const line = JSON.stringify(row);
fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
fs.appendFileSync(ledgerPath, `${line}\n`, "utf8");
process.stdout.write(`${line}\n`);
