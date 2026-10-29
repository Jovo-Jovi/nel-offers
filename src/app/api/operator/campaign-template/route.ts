import { readFile as readBytes } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { jsonCode } from "@/lib/json-code";
import { withOperator } from "@/lib/operator-route";

const workbookType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET() {
  return withOperator(async () => {
    try {
      const bytes = await readBytes(path.join(process.cwd(), "assets", "templates", "NELO_offers_template.xlsx"));
      return new NextResponse(bytes, {
        headers: {
          "content-type": workbookType,
          "content-disposition": 'attachment; filename="NELO_offers_template.xlsx"',
        },
      });
    } catch {
      return jsonCode(422, "rejected");
    }
  });
}
