export type LocationRead = { clean: true } | { refusal: "location" | "unreadable" };

const xyz = Uint8Array.from([0xa9, 0x78, 0x79, 0x7a]);
const locationKey = new TextEncoder().encode("com.apple.quicktime.location");

function containsBytes(haystack: Uint8Array, needle: Uint8Array) {
  if (needle.length === 0 || haystack.length < needle.length) return false;
  const last = haystack.length - needle.length;
  for (let index = 0; index <= last; index += 1) {
    let matched = true;
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (haystack[index + offset] !== needle[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}

function fourcc(bytes: Uint8Array) {
  return String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0);
}

export async function readMp4Location(blob: Blob): Promise<LocationRead> {
  const total = blob.size;
  let offset = 0;
  let moov: Uint8Array | null = null;
  while (offset + 8 <= total) {
    const header = new Uint8Array(await blob.slice(offset, offset + 8).arrayBuffer());
    const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
    let size = view.getUint32(0);
    const type = fourcc(header.subarray(4, 8));
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > total) return { refusal: "unreadable" };
      const wide = new Uint8Array(await blob.slice(offset + 8, offset + 16).arrayBuffer());
      const wideView = new DataView(wide.buffer, wide.byteOffset, wide.byteLength);
      const high = wideView.getUint32(0);
      const low = wideView.getUint32(4);
      if (high > 0) return { refusal: "unreadable" };
      size = low;
      headerSize = 16;
    }
    if (size === 0) size = total - offset;
    if (size < headerSize || offset + size > total) return { refusal: "unreadable" };
    if (type === "moov") {
      moov = new Uint8Array(await blob.slice(offset + headerSize, offset + size).arrayBuffer());
    }
    offset += size;
  }
  if (!moov) return { refusal: "unreadable" };
  if (containsBytes(moov, xyz) || containsBytes(moov, locationKey)) return { refusal: "location" };
  return { clean: true };
}
