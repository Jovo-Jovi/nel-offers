import { describe, expect, it } from "vitest";
import { normaliseSearch } from "./search-normalise";

describe("normaliseSearch", () => {
  it("drops Arabic diacritics", () => {
    expect(normaliseSearch("م\u064E\u0631\u0652\u062D\u064E\u0628\u0627")).toBe("\u0645\u0631\u062D\u0628\u0627");
  });

  it("drops tatweel", () => {
    expect(normaliseSearch("\u0645\u0640\u0631\u062D\u0628\u0627")).toBe("\u0645\u0631\u062D\u0628\u0627");
  });

  it("reads alef variants as alef", () => {
    expect(normaliseSearch("\u0623\u062D\u0645\u062F \u0625\u0633\u0644\u0627\u0645 \u0622\u064A\u0629 \u0671\u0633\u0645")).toBe(
      "\u0627\u062D\u0645\u062F \u0627\u0633\u0644\u0627\u0645 \u0627\u064A\u0647 \u0627\u0633\u0645",
    );
  });

  it("reads alef maksura as yeh", () => {
    expect(normaliseSearch("\u0639\u0644\u0649")).toBe("\u0639\u0644\u064A");
  });

  it("reads teh marbuta as heh", () => {
    expect(normaliseSearch("\u062A\u062D\u0644\u064A\u0629")).toBe("\u062A\u062D\u0644\u064A\u0647");
  });

  it("lower-cases Latin", () => {
    expect(normaliseSearch("SyNtHeTiC")).toBe("synthetic");
  });

  it("trims and collapses spaces", () => {
    expect(normaliseSearch("  a   b  ")).toBe("a b");
  });
});
