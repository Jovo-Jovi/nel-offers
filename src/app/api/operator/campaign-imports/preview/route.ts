import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { diffCampaignRows } from "@/lib/campaign-sheet-diff";
import { readCampaignSheet, sheetWarnings } from "@/lib/campaign-sheet";
import { jsonCode } from "@/lib/json-code";
import { readCampaign, readLedger, readCampaignOfferRows, readToday } from "@/lib/operator-data";
import { withOperator } from "@/lib/operator-route";
import { readWorkbookPart } from "@/lib/workbook-part";

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function POST(request: Request) {
  return withOperator(async (gate) => {
    const loaded = await readWorkbookPart(request);
    if ("error" in loaded) return loaded.error;
    let parsed;
    try {
      parsed = await readCampaignSheet(loaded.bytes);
    } catch {
      return jsonCode(422, "not-a-workbook");
    }
    const ledger = await readLedger(gate);
    const today = await readToday(gate);
    const campaign = await readCampaign(gate);
    const stored = await readCampaignOfferRows(gate);
    if (!ledger || !today || !campaign || !stored) return jsonCode(422, "rejected");
    const diff = diffCampaignRows(parsed.rows, stored);
    return NextResponse.json({
      sheetSha256: sha256(loaded.bytes),
      expectedCount: ledger.count,
      expectedUpdatedAt: ledger.updatedAt,
      errors: parsed.errors,
      warnings: sheetWarnings(parsed.rows, today, campaign.is_published === true),
      additions: diff.additions,
      updates: diff.updates,
      unchangedCount: diff.unchangedCount,
      published: campaign.is_published === true,
    });
  });
}
