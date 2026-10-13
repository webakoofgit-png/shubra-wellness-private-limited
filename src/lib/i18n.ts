import en from "../locales/en.json";
import mr from "../locales/mr.json";
import hi from "../locales/hi.json";
import kn from "../locales/kn.json";
export type Language = "en" | "mr" | "hi" | "kn";
export const languages = { en: "English", mr: "मराठी", hi: "हिन्दी", kn: "ಕನ್ನಡ" };
const dictionaries: Record<Language, Record<string, string>> = { en, mr, hi, kn };
export function translate(language: Language, key: string): string {
  return dictionaries[language][key] ?? (en as Record<string, string>)[key] ?? key;
}
