import { readFile as readBytes } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { buildCampaignExport } from "@/lib/campaign-export";
import { cairoDay } from "@/lib/format-values";
import { jsonCode } from "@/lib/json-code";
import { readCampaignOfferRows, toNormalised } from "@/lib/operator-data";
import { withOperator } from "@/lib/operator-route";
import { firstDataRow } from "@/lib/sheet-format";

const workbookType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET() {
  return withOperator(async (gate) => {
    try {
      const template = new Uint8Array(
        await readBytes(path.join(process.cwd(), "assets", "templates", "NELO_offers_template.xlsx")),
      );
      const stored = await readCampaignOfferRows(gate);
      if (!stored) return jsonCode(422, "rejected");
      const rows = stored.map((row, index) => toNormalised(row, firstDataRow + index));
      const bytes = await buildCampaignExport(template, rows);
      const filename = `NELO_offers_export_${cairoDay()}.xlsx`;
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "content-type": workbookType,
          "content-disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch {
      return jsonCode(422, "rejected");
    }
  });
}
