import { createHmac } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(value: string) {
  const cleaned = value.toUpperCase().replace(/=+$/g, "").replace(/\s/g, "");
  let bits = "";
  for (const char of cleaned) {
    const index = alphabet.indexOf(char);
    if (index < 0) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  return Buffer.from(bytes);
}

export function currentCode(secret: string, at = Date.now()) {
  const key = decodeBase32(secret);
  const counter = Math.floor(at / 1000 / 30);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0xf;
  const binary =
    ((digest[offset] ?? 0) & 0x7f) * 2 ** 24 +
    (digest[offset + 1] ?? 0) * 2 ** 16 +
    (digest[offset + 2] ?? 0) * 2 ** 8 +
    (digest[offset + 3] ?? 0);
  return String(binary % 10 ** 6).padStart(6, "0");
}

export function windowRemain(at = Date.now()) {
  return 30 - (Math.floor(at / 1000) % 30);
}
