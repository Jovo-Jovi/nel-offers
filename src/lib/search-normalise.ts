const diacritics = /[\u064B-\u0652]/g;
const tatweel = /\u0640/g;
const alef = /[\u0622\u0623\u0625\u0671]/g;
const alefMaksura = /\u0649/g;
const tehMarbuta = /\u0629/g;

export function normaliseSearch(value: string) {
  return value
    .replace(diacritics, "")
    .replace(tatweel, "")
    .replace(alef, "\u0627")
    .replace(alefMaksura, "\u064A")
    .replace(tehMarbuta, "\u0647")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
