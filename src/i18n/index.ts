import { ar, type Dictionary } from "./ar";

export type Locale = "ar";
export const defaultLocale: Locale = "ar";

const dictionaries: Record<Locale, Dictionary> = { ar };

/** Single entry point for UI strings. Add "en" here when English content exists. */
export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale];
}

/** Convenience for components: the active dictionary. */
export const t: Dictionary = getDictionary();
