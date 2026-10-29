import { jsonCode } from "@/lib/json-code";
import { workbookByteLimit } from "@/lib/sheet-format";

type WorkbookPart = { error: Response } | { form: FormData; bytes: Uint8Array };

export async function readWorkbookPart(request: Request): Promise<WorkbookPart> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { error: jsonCode(422, "not-a-workbook") };
  }
  const part = form.get("workbook");
  if (!(part instanceof Blob)) return { error: jsonCode(422, "not-a-workbook") };
  if (part.size > workbookByteLimit) return { error: jsonCode(413, "too-large") };
  if (part.size === 0) return { error: jsonCode(422, "not-a-workbook") };
  const bytes = new Uint8Array(await part.arrayBuffer());
  return { form, bytes };
}
