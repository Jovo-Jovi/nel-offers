import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { readCampaignSheet } from "@/lib/campaign-sheet";
import { jsonCode } from "@/lib/json-code";
import { withOperator } from "@/lib/operator-route";
import { readWorkbookPart } from "@/lib/workbook-part";

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function POST(request: Request) {
  return withOperator(async (gate) => {
    const loaded = await readWorkbookPart(request);
    if ("error" in loaded) return loaded.error;
    const shaField = loaded.form.get("sheetSha256");
    const countField = loaded.form.get("expectedCount");
    const updatedField = loaded.form.get("expectedUpdatedAt");
    if (typeof shaField !== "string" || !/^[0-9a-f]{64}$/i.test(shaField)) return jsonCode(422, "rejected");
    if (typeof countField !== "string" || !/^\d+$/.test(countField)) return jsonCode(422, "rejected");
    const expectedCount = Number(countField);
    if (!Number.isSafeInteger(expectedCount)) return jsonCode(422, "rejected");
    const expectedUpdatedAt = typeof updatedField === "string" && updatedField.length > 0 ? updatedField : null;
    if (expectedUpdatedAt && expectedUpdatedAt.length > 40) return jsonCode(422, "rejected");
    const digest = sha256(loaded.bytes);
    if (digest !== shaField.toLowerCase()) return jsonCode(409, "sheet-changed");
    let parsed;
    try {
      parsed = await readCampaignSheet(loaded.bytes);
    } catch {
      return jsonCode(422, "not-a-workbook");
    }
    if (parsed.errors.length > 0 || parsed.rows.length === 0) return jsonCode(422, "sheet-errors");
    const applied = await gate.supabase.rpc("apply_campaign_import", {
      p_sheet_sha256: digest,
      p_rows: parsed.rows,
      p_expected_count: expectedCount,
      p_expected_updated_at: expectedUpdatedAt,
    });
    if (applied.error) {
      if (applied.error.code === "PT409") return jsonCode(409, "changed-since-preview");
      return jsonCode(422, "rejected");
    }
    const importId = typeof applied.data === "string" ? applied.data : "";
    const counts = await gate.supabase
      .from("CampaignImport")
      .select("added_count, updated_count, unchanged_count")
      .eq("id", importId)
      .maybeSingle();
    return NextResponse.json({
      added: counts.data?.added_count ?? 0,
      updated: counts.data?.updated_count ?? 0,
      unchanged: counts.data?.unchanged_count ?? 0,
    });
  });
}
