import { describe, expect, it } from "vitest";
import { resolveUploadName } from "./media-object-name";

const codes = new Set(["AB", "CD"]);
const overlapping = new Set(["AB", "AB-1"]);

describe("resolveUploadName", () => {
  it("maps an image stem to the main image", () => {
    expect(resolveUploadName("ab.jpg", codes)).toEqual({ code: "AB", slot: "main_image" });
    expect(resolveUploadName("AB.jpeg", codes)).toEqual({ code: "AB", slot: "main_image" });
    expect(resolveUploadName("AB.png", codes)).toEqual({ code: "AB", slot: "main_image" });
    expect(resolveUploadName("AB.webp", codes)).toEqual({ code: "AB", slot: "main_image" });
    expect(resolveUploadName("CD.JPG", codes)).toEqual({ code: "CD", slot: "main_image" });
  });

  it("maps a video stem to the main video", () => {
    expect(resolveUploadName("AB.mp4", codes)).toEqual({ code: "AB", slot: "main_video" });
    expect(resolveUploadName("AB.MP4", codes)).toEqual({ code: "AB", slot: "main_video" });
  });

  it("maps a gallery suffix to its slot", () => {
    expect(resolveUploadName("AB-1.jpeg", codes)).toEqual({ code: "AB", slot: "gallery_1" });
    expect(resolveUploadName("AB-2.png", codes)).toEqual({ code: "AB", slot: "gallery_2" });
    expect(resolveUploadName("ab-3.webp", codes)).toEqual({ code: "AB", slot: "gallery_3" });
  });

  it("uses the leaf of a path", () => {
    expect(resolveUploadName("notes/AB.mp4", codes)).toEqual({ code: "AB", slot: "main_video" });
    expect(resolveUploadName("notes\\AB.jpg", codes)).toEqual({ code: "AB", slot: "main_image" });
  });

  it("refuses a code that is also that code plus a gallery suffix", () => {
    expect(resolveUploadName("AB-1.jpg", overlapping)).toEqual({ refusal: "ambiguous" });
    expect(resolveUploadName("AB-1.mp4", overlapping)).toEqual({ refusal: "ambiguous" });
  });

  it("treats an exact gallery-shaped code as the main slot", () => {
    expect(resolveUploadName("AB-1.mp4", new Set(["AB-1"]))).toEqual({
      code: "AB-1",
      slot: "main_video",
    });
  });

  it("refuses a video that only matches a gallery suffix", () => {
    expect(resolveUploadName("AB-1.mp4", codes)).toEqual({ refusal: "video-in-gallery" });
  });

  it("refuses an unknown code", () => {
    expect(resolveUploadName("ZZ.mp4", codes)).toEqual({ refusal: "unknown-code" });
    expect(resolveUploadName("AB-4.jpg", codes)).toEqual({ refusal: "unknown-code" });
  });

  it("refuses a bad extension before it looks at the code", () => {
    expect(resolveUploadName("AB.txt", codes)).toEqual({ refusal: "bad-extension" });
    expect(resolveUploadName("ZZ.gif", codes)).toEqual({ refusal: "bad-extension" });
    expect(resolveUploadName("AB.", codes)).toEqual({ refusal: "bad-extension" });
    expect(resolveUploadName(".jpg", codes)).toEqual({ refusal: "bad-extension" });
    expect(resolveUploadName("AB", codes)).toEqual({ refusal: "bad-extension" });
  });
});
