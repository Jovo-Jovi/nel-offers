const objectKeyPattern = /^media\/[0-9a-f-]{36}\.(mp4|webp)$/;

export function isObjectKey(value: string) {
  return objectKeyPattern.test(value);
}

export function mimeType(value: string) {
  const semi = value.indexOf(";");
  const bare = semi === -1 ? value : value.slice(0, semi);
  return bare.trim().toLowerCase();
}
