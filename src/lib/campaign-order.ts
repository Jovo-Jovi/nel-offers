export type OrderedRow = {
  display_order: number | null;
  sheet_row: number;
  code_key: string;
};

export function compareCampaignOrder(earlier: OrderedRow, later: OrderedRow) {
  if (earlier.display_order === null && later.display_order !== null) return 1;
  if (earlier.display_order !== null && later.display_order === null) return -1;
  if (
    earlier.display_order !== null &&
    later.display_order !== null &&
    earlier.display_order !== later.display_order
  ) {
    return earlier.display_order - later.display_order;
  }
  if (earlier.sheet_row !== later.sheet_row) return earlier.sheet_row - later.sheet_row;
  if (earlier.code_key < later.code_key) return -1;
  if (earlier.code_key > later.code_key) return 1;
  return 0;
}
