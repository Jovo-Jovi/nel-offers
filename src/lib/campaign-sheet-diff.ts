import type { NormalisedRow } from "@/lib/campaign-sheet";
import { twoDecimals } from "@/lib/sheet-format";

export type StoredCampaignOffer = {
  code_key: string;
  code: string;
  name_ar: string;
  name_en: string;
  price_egp: string;
  starts_on: string | null;
  ends_on: string;
  conditions_ar: string | null;
  conditions_en: string | null;
  display_order: number | null;
};

export type FieldChange = {
  field: string;
  previous: string;
  next: string;
};

export type RowUpdate = {
  code: string;
  changes: FieldChange[];
};

const compared = [
  "code",
  "name_ar",
  "name_en",
  "price_egp",
  "starts_on",
  "ends_on",
  "conditions_ar",
  "conditions_en",
  "display_order",
] as const;

function show(value: string | number | null) {
  if (value === null) return "";
  return String(value);
}

function fieldValue(row: NormalisedRow | StoredCampaignOffer, field: (typeof compared)[number]) {
  if (field === "price_egp") return twoDecimals(row.price_egp);
  return row[field];
}

export function diffCampaignRows(incoming: NormalisedRow[], stored: StoredCampaignOffer[]) {
  const byKey = new Map(stored.map((row) => [row.code_key, row]));
  const additions: NormalisedRow[] = [];
  const updates: RowUpdate[] = [];
  let unchangedCount = 0;
  for (const row of incoming) {
    const current = byKey.get(row.code.toUpperCase());
    if (!current) {
      additions.push(row);
      continue;
    }
    const changes: FieldChange[] = [];
    for (const field of compared) {
      const previous = fieldValue(current, field);
      const next = fieldValue(row, field);
      if (show(previous) !== show(next)) {
        changes.push({ field, previous: show(previous), next: show(next) });
      }
    }
    if (changes.length === 0) unchangedCount += 1;
    else updates.push({ code: row.code, changes });
  }
  return { additions, updates, unchangedCount };
}
