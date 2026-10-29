import { describe, expect, it } from "vitest";
import { readMp4Location } from "./mp4-location";

function box(type: string, payload: Uint8Array) {
  const out = new Uint8Array(8 + payload.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, out.length);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(payload, 8);
  return out;
}

function concat(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return new Blob([out], { type: "video/mp4" });
}

const free = new TextEncoder().encode("free-text");

describe("readMp4Location", () => {
  it("accepts a clean moov and refuses location keys and a missing moov", async () => {
    const clean = concat([box("ftyp", free), box("moov", free)]);
    const marked = concat([box("ftyp", free), box("moov", Uint8Array.from([0xa9, 0x78, 0x79, 0x7a, 1]))]);
    const keyed = concat([
      box("ftyp", free),
      box("moov", new TextEncoder().encode("com.apple.quicktime.location")),
    ]);
    const missing = concat([box("ftyp", free)]);
    expect(await readMp4Location(clean)).toEqual({ clean: true });
    expect(await readMp4Location(marked)).toEqual({ refusal: "location" });
    expect(await readMp4Location(keyed)).toEqual({ refusal: "location" });
    expect(await readMp4Location(missing)).toEqual({ refusal: "unreadable" });
  });
});
