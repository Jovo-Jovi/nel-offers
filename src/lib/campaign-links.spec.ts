import { describe, expect, it } from "vitest";
import { catalogue } from "@/i18n/ar";
import { chatLink, dialLink, orderLink } from "./campaign-links";
import { fillMessage } from "./fill-message";

describe("campaign links", () => {
  it("builds the chat link, the order link and the dial link from short parts", () => {
    const digits = ["20", "111", "222", "333"].join("");
    const dial = ["+", "2", "0", "0"].join("");
    const message = fillMessage(catalogue.campaignOffer.orderMessage, {
      name: "\u062A\u062D\u0644\u064A\u0644 \u062A\u062C\u0631\u064A\u0628\u064A 01",
    });
    expect(chatLink(digits)).toBe(`https://wa.me/${digits}`);
    expect(orderLink(digits, message)).toBe(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`);
    expect(decodeURIComponent(new URL(orderLink(digits, message)).searchParams.get("text") ?? "")).toBe(message);
    expect(dialLink(dial)).toBe(`tel:${dial}`);
  });
});
