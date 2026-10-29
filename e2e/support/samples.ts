function box(type: string, payload: Buffer) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + payload.length);
  header.write(type, 4, "ascii");
  return Buffer.concat([header, payload]);
}

export function cleanMp4() {
  return Buffer.concat([
    box("ftyp", Buffer.from("isom")),
    box("moov", Buffer.from("mvhd")),
    box("mdat", Buffer.from("x")),
  ]);
}

export function locatedMp4() {
  return Buffer.concat([
    box("ftyp", Buffer.from("isom")),
    box("moov", Buffer.from([0xa9, 0x78, 0x79, 0x7a])),
  ]);
}

export const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export const otherPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
