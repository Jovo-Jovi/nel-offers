import ExcelJS from "exceljs";
import JSZip from "jszip";

type ZipEntry = {
  dir?: boolean;
  async(kind: "string"): Promise<string>;
};

// The template stores comment links at an absolute path exceljs does not index.
// A copy is patched in memory; the bytes served for download stay untouched.
export async function loadWorkbook(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  const entries = zip["files"] as Record<string, ZipEntry>;
  const open = zip["file"] as (this: unknown, path: string, data?: string) => ZipEntry | null | void;
  const pack = zip["generateAsync"] as (this: unknown, options: { type: "nodebuffer" }) => Promise<Buffer>;
  for (const name of Object.keys(entries)) {
    if (!name.endsWith(".rels") || entries[name]?.dir) continue;
    const entry = open.call(zip, name);
    if (!entry) continue;
    const xml = await entry.async("string");
    const stripped = xml.replace(/<Relationship\b[^>]*\/>/g, (tag) =>
      /comments|vmlDrawing/.test(tag) ? "" : tag,
    );
    if (stripped !== xml) open.call(zip, name, stripped);
  }
  const patched = await pack.call(zip, { type: "nodebuffer" });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Uint8Array.from(patched) as never);
  return workbook;
}
