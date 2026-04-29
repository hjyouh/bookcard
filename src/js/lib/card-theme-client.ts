import { DEFAULT_CARD_THEME_ID } from "@/lib/card-themes";
import { CardThemeId } from "@/lib/types";

export const CARD_THEME_STORAGE_KEY = "reading-card-theme";
export const CARD_THEME_EVENT = "reading-card-theme-change";

export function getStoredCardTheme(): CardThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_CARD_THEME_ID;
  }

  const stored = window.localStorage.getItem(CARD_THEME_STORAGE_KEY) as CardThemeId | null;
  return stored ?? DEFAULT_CARD_THEME_ID;
}

export function setStoredCardTheme(themeId: CardThemeId) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CARD_THEME_STORAGE_KEY, themeId);
  window.dispatchEvent(new CustomEvent(CARD_THEME_EVENT, { detail: themeId }));
}
