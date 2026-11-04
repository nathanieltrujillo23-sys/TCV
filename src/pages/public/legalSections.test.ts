import { describe, expect, it } from "vitest";
import { en } from "../../i18n/en";
import { DISCLOSURE_SECTIONS, PRIVACY_SECTIONS, TERMS_SECTIONS } from "./legalSections";

describe("legal page sections", () => {
  it("every generated key has English text", () => {
    for (const s of [...DISCLOSURE_SECTIONS, ...PRIVACY_SECTIONS, ...TERMS_SECTIONS]) {
      expect(en[s.titleKey], s.titleKey).toBeTruthy();
      expect(en[s.bodyKey], s.bodyKey).toBeTruthy();
    }
  });
});
