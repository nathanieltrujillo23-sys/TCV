import type { StringKey } from "../../i18n/en";

export interface LegalSection {
  titleKey: StringKey;
  bodyKey: StringKey;
}

function numbered(prefix: "disclosures" | "privacy" | "terms", count: number): LegalSection[] {
  return Array.from({ length: count }, (_, i) => ({
    titleKey: `${prefix}.s${i + 1}.title` as StringKey,
    bodyKey: `${prefix}.s${i + 1}.body` as StringKey,
  }));
}

export const DISCLOSURE_SECTIONS = numbered("disclosures", 7);
export const PRIVACY_SECTIONS = numbered("privacy", 7);
export const TERMS_SECTIONS = numbered("terms", 9);
