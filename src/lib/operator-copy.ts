import type { Catalogue } from "@/i18n/ar";
import type { ErrorKind } from "@/lib/campaign-sheet";
import { fillMessage } from "@/lib/fill-message";
import { conditionLimit, nameLimit } from "@/lib/sheet-format";

const errorText: Record<ErrorKind, (messages: Catalogue) => string> = {
  "wrong-sheet": (messages) => messages.operator.kindWrongSheet,
  "wrong-header": (messages) => messages.operator.kindWrongHeader,
  "extra-cell": (messages) => messages.operator.kindExtraCell,
  empty: (messages) => messages.operator.kindEmpty,
  pattern: (messages) => messages.operator.kindPattern,
  "duplicate-code": (messages) => messages.operator.kindDuplicateCode,
  "too-long": (messages) => messages.operator.kindTooLong,
  negative: (messages) => messages.operator.kindNegative,
  decimals: (messages) => messages.operator.kindDecimals,
  "price-range": (messages) => messages.operator.kindPriceRange,
  "not-a-date": (messages) => messages.operator.kindNotADate,
  "time-part": (messages) => messages.operator.kindTimePart,
  "date-floor": (messages) => messages.operator.kindDateFloor,
  "start-after-end": (messages) => messages.operator.kindStartAfterEnd,
  "one-condition": (messages) => messages.operator.kindOneCondition,
  "not-whole": (messages) => messages.operator.kindNotWhole,
  formula: (messages) => messages.operator.kindFormula,
  "error-cell": (messages) => messages.operator.kindErrorCell,
  email: (messages) => messages.operator.kindEmail,
  mobile: (messages) => messages.operator.kindMobile,
  "national-id": (messages) => messages.operator.kindNationalId,
  "no-rows": (messages) => messages.operator.kindNoRows,
};

export function sheetErrorText(messages: Catalogue, kind: string, column: string) {
  const reader = errorText[kind as ErrorKind];
  if (!reader) return messages.operator.rejected;
  const limit = column === "conditions_ar" || column === "conditions_en" ? conditionLimit : nameLimit;
  return fillMessage(reader(messages), { limit: String(limit) });
}

export function warningText(messages: Catalogue, kind: string) {
  if (kind === "ended") return messages.operator.warnEnded;
  if (kind === "not-visible") return messages.operator.warnNotVisible;
  if (kind === "published") return messages.operator.warnPublished;
  return messages.operator.rejected;
}

export function slotText(messages: Catalogue, slot: string) {
  if (slot === "main_video") return messages.operator.slotMainVideo;
  if (slot === "main_image") return messages.operator.slotMainImage;
  if (slot === "gallery_1") return fillMessage(messages.operator.slotGallery, { index: "1" });
  if (slot === "gallery_2") return fillMessage(messages.operator.slotGallery, { index: "2" });
  if (slot === "gallery_3") return fillMessage(messages.operator.slotGallery, { index: "3" });
  return slot;
}
