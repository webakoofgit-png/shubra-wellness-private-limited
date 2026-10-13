import { describe, expect, it } from "vitest";
import en from "@/locales/en.json";
import mr from "@/locales/mr.json";
import hi from "@/locales/hi.json";
import kn from "@/locales/kn.json";
import { translate } from "@/lib/i18n";
describe("Unicode and translation coverage", () => {
  for (const [language, dictionary] of Object.entries({ mr, hi, kn })) {
    it(`${language} covers all English UI keys without encoding loss`, () => {
      expect(Object.keys(dictionary).sort()).toEqual(Object.keys(en).sort());
      expect(Object.values(dictionary).some((value) => /\?{2,}|\uFFFD/.test(value))).toBe(false);
    });
  }
  it("renders native scripts and falls back for unknown content", () => {
    expect(translate("mr", "Language")).toBe("भाषा");
    expect(translate("hi", "Language")).toBe("भाषा");
    expect(translate("kn", "Language")).toBe("ಭಾಷೆ");
    expect(translate("mr", "Untranslated product name")).toBe("Untranslated product name");
  });
});
