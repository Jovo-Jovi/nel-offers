import { describe, expect, it } from "vitest";
import {
  encodedImageByteLimit,
  imageLongestEdge,
  selectedImageByteLimit,
  videoByteLimit,
  withinLimit,
  withinLongestEdge,
} from "./media-object-limits";

describe("withinLimit", () => {
  it("accepts a video at the limit and rejects one byte past it", () => {
    expect(withinLimit(videoByteLimit, videoByteLimit)).toBe(true);
    expect(withinLimit(videoByteLimit - 1, videoByteLimit)).toBe(true);
    expect(withinLimit(videoByteLimit + 1, videoByteLimit)).toBe(false);
  });

  it("accepts a selected image at the limit and rejects one byte past it", () => {
    expect(withinLimit(selectedImageByteLimit, selectedImageByteLimit)).toBe(true);
    expect(withinLimit(selectedImageByteLimit - 1, selectedImageByteLimit)).toBe(true);
    expect(withinLimit(selectedImageByteLimit + 1, selectedImageByteLimit)).toBe(false);
  });

  it("accepts an encoded image at the limit and rejects one byte past it", () => {
    expect(withinLimit(encodedImageByteLimit, encodedImageByteLimit)).toBe(true);
    expect(withinLimit(encodedImageByteLimit - 1, encodedImageByteLimit)).toBe(true);
    expect(withinLimit(encodedImageByteLimit + 1, encodedImageByteLimit)).toBe(false);
  });

  it("rejects zero and a fractional byte", () => {
    expect(withinLimit(0, encodedImageByteLimit)).toBe(false);
    expect(withinLimit(1.5, encodedImageByteLimit)).toBe(false);
  });
});

describe("withinLongestEdge", () => {
  it("accepts the longest edge and rejects one pixel past it", () => {
    expect(withinLongestEdge(imageLongestEdge)).toBe(true);
    expect(withinLongestEdge(imageLongestEdge - 1)).toBe(true);
    expect(withinLongestEdge(imageLongestEdge + 1)).toBe(false);
    expect(withinLongestEdge(0)).toBe(false);
  });
});
