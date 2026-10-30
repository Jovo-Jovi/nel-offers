import { describe, expect, it } from "vitest";
import { localeCodes, messagesFor } from "@/i18n/config";
import { fillMessage } from "./fill-message";

const syntheticName = "Synthetic analysis";

describe("visitor copy", () => {
  for (const locale of localeCodes) {
    it(`leaves the code out of the visitor strings in ${locale}`, () => {
      const messages = messagesFor(locale);
      expect(messages.campaignOffer.orderMessage).not.toContain("{code}");
      expect(messages.campaignOffer.pageHeading).not.toContain("{code}");
      expect(messages.header.campaignOfferSubtitle).not.toContain("{code}");
      const filled = fillMessage(messages.campaignOffer.orderMessage, { name: syntheticName });
      expect(filled).toContain(syntheticName);
      expect(filled).not.toContain("{");
    });
  }
});
