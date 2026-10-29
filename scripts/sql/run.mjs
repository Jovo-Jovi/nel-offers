// NELO — SQL runner (DECISIONS.md OD-04 item 1; SECURITY_MODEL.md §2.1). Reviewer-authored tooling,
// landed byte-exact by T05. It is how the builder applies a reviewer-authored migration or runs a
// reviewer-authored proof, gate read or operation against the Supabase database.
//
//   npm run sql -- <path> [--apply]
//
// It runs one SQL text only when all hold: the path is under supabase/migrations, supabase/checks or
// supabase/ops and ends in .sql; the path is tracked and unchanged in the working tree; the committed
// bytes' SHA-256 is listed for that path in a docs/method/*_BUNDLE.sha256 manifest at HEAD. It runs the
// committed bytes (git show HEAD:<path>), never the working copy. A migration or an operation needs
// --apply and runs inside one transaction; a check runs as it is, and a proof's closing exception is its
// outcome.
//
// Connection: SUPABASE_DB_URL (the Supabase Session pooler URI) and SUPABASE_DB_CA (the path of the
// project's CA certificate), from .env.local only. TLS is always verified against that CA; there is no
// option to turn verification off. Any query string in the URI is ignored.
//
// Output, one line each: "SQL <path> sha256=<12 hex>", then one of
//   APPLIED · ROW <name>=<value> … · RAISED <message> · FAILED <sqlstate> <message> ·
//   CONNECT FAILED <code> · REFUSED <reason>.
// It never prints an environment value, a host, a user name or the URI. Exit: 0 applied, rows read or
// a proof that passed; 1 the SQL failed or a proof did not pass; 2 refused; 3 no connection.

import { createHash } from "node:crypto";
import childProcess from "node:child_process";
import fs from "node:fs";
import pg from "pg";

const placesNeedingApply = ["supabase/migrations/", "supabase/ops/"];
const pathPattern = /^supabase\/(migrations|checks|ops)\/[A-Za-z0-9_.-]+\.sql$/;
const passPattern = /: PASS (\d+)\/(\d+)$/;

function refused(reason) {
  console.log(`REFUSED ${reason}`);
  return 2;
}

function git(args) {
  return childProcess.execFileSync("git", args, { maxBuffer: 64 * 1024 * 1024 });
}

function gitQuiet(args) {
  try {
    childProcess.execFileSync("git", args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function listedInManifest(sqlPath, digest) {
  const names = git(["ls-tree", "--name-only", "HEAD", "docs/method/"])
    .toString("utf8")
    .split("\n")
    .filter((name) => /^docs\/method\/[A-Za-z0-9]+_BUNDLE\.sha256$/.test(name));
  for (const name of names) {
    const lines = git(["show", `HEAD:${name}`]).toString("utf8").split("\n");
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 3 && parts[0] === digest && parts[2] === sqlPath) return true;
    }
  }
  return false;
}

function printRows(outcome) {
  const outcomes = Array.isArray(outcome) ? outcome : [outcome];
  const last = outcomes[outcomes.length - 1];
  if (!last || !Array.isArray(last.rows) || last.rows.length === 0) return false;
  for (const row of last.rows) {
    const pairs = Object.entries(row).map(([name, value]) => `${name}=${value === null ? "null" : String(value)}`);
    console.log(`ROW ${pairs.join(" ")}`);
  }
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const positional = args.filter((arg) => arg !== "--apply");
  if (positional.length !== 1 || args.length - positional.length > 1) {
    return refused("usage: npm run sql -- <path> [--apply]");
  }

  const sqlPath = positional[0].replace(/\\/g, "/").replace(/^\.\//, "");
  if (!pathPattern.test(sqlPath)) {
    return refused("path is not a .sql under supabase/migrations, supabase/checks or supabase/ops");
  }
  if (!gitQuiet(["ls-files", "--error-unmatch", "--", sqlPath])) return refused("path is not tracked");
  if (!gitQuiet(["diff", "--quiet", "HEAD", "--", sqlPath])) return refused("working copy differs from HEAD");

  const bytes = git(["show", `HEAD:${sqlPath}`]);
  const digest = createHash("sha256").update(bytes).digest("hex");
  console.log(`SQL ${sqlPath} sha256=${digest.slice(0, 12)}`);
  if (!listedInManifest(sqlPath, digest)) return refused("no bundle manifest lists these bytes");

  const needsApply = placesNeedingApply.some((place) => sqlPath.startsWith(place));
  if (needsApply && !apply) return refused("a migration or an operation needs --apply");
  if (!needsApply && apply) return refused("--apply is only for a migration or an operation");

  const rawUrl = process.env.SUPABASE_DB_URL;
  const caPath = process.env.SUPABASE_DB_CA;
  if (!rawUrl || !caPath) return refused("SUPABASE_DB_URL and SUPABASE_DB_CA must be set in .env.local");

  let ca;
  let target;
  try {
    ca = fs.readFileSync(caPath, "utf8");
    target = new URL(rawUrl);
    target.search = "";
  } catch {
    return refused("SUPABASE_DB_URL or SUPABASE_DB_CA cannot be read");
  }

  const client = new pg.Client({
    connectionString: target.toString(),
    ssl: { ca, rejectUnauthorized: true, servername: target.hostname },
  });
  client.on("notice", () => {});
  client.on("error", () => {});

  try {
    await client.connect();
  } catch (error) {
    const code = error && typeof error.code === "string" ? error.code : "unknown";
    console.log(`CONNECT FAILED ${code}`);
    return 3;
  }

  const sqlText = bytes.toString("utf8");
  try {
    if (needsApply) {
      await client.query("begin");
      try {
        const outcome = await client.query(sqlText);
        await client.query("commit");
        printRows(outcome);
        console.log("APPLIED");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    } else {
      const outcome = await client.query(sqlText);
      if (!printRows(outcome)) console.log("ROW none");
    }
    return 0;
  } catch (error) {
    const message = error && typeof error.message === "string" ? error.message.replace(/\s+/g, " ") : "";
    const sqlstate = error && typeof error.code === "string" ? error.code : "unknown";
    const passed = passPattern.exec(message);
    if (sqlstate === "P0001" && / PROOF /.test(message)) {
      console.log(`RAISED ${message}`);
      return !needsApply && passed && passed[1] === passed[2] ? 0 : 1;
    }
    console.log(`FAILED ${sqlstate} ${message}`);
    return 1;
  } finally {
    await client.end().catch(() => {});
  }
}

process.exitCode = await main();
