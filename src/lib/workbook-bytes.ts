import ExcelJS from "exceljs";
import JSZip from "jszip";

// The template stores comment links at an absolute path exceljs does not index.
// A copy is patched in memory; the bytes served for download stay untouched.
export async function loadWorkbook(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  for (const name of Object.keys(zip.files)) {
    const listed = zip.files[name];
    if (!listed || !name.endsWith(".rels") || listed.dir) continue;
    const entry = zip.file(name);
    if (!entry) continue;
    const xml = await entry.async("string");
    const stripped = xml.replace(/<Relationship\b[^>]*\/>/g, (tag) =>
      /comments|vmlDrawing/.test(tag) ? "" : tag,
    );
    if (stripped !== xml) zip.file(name, stripped);
  }
  const patched = await zip.generateAsync({ type: "nodebuffer" });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Uint8Array.from(patched) as never);
  return workbook;
}
