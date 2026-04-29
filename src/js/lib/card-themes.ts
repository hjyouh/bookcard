import { CardThemeId } from "@/lib/types";

export interface CardTheme {
  id: CardThemeId;
  name: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
}

export const CARD_THEMES: CardTheme[] = [
  { id: "butter", name: "버터", background: "#f5e9a6", surface: "#f7edb9", border: "#d8cf99", text: "#1c1917", muted: "#6b6458" },
  { id: "mint", name: "민트", background: "#dff3e6", surface: "#eaf8ef", border: "#b7d8c3", text: "#183026", muted: "#527164" },
  { id: "peach", name: "피치", background: "#f9dfd2", surface: "#fdebe3", border: "#e4baa7", text: "#3b221c", muted: "#835b4f" },
  { id: "sky", name: "스카이", background: "#dceeff", surface: "#eaf5ff", border: "#b7d1ea", text: "#182b40", muted: "#56708b" },
  { id: "lavender", name: "라벤더", background: "#ebe2ff", surface: "#f3edff", border: "#cabbe7", text: "#2c2145", muted: "#6b5f88" },
  { id: "rose", name: "로즈", background: "#f8dde7", surface: "#fdeaf0", border: "#dfb6c5", text: "#3e1f2c", muted: "#7b5867" },
  { id: "sage", name: "세이지", background: "#e4ead8", surface: "#eef3e5", border: "#c4cfb0", text: "#263021", muted: "#66715d" },
  { id: "cream", name: "크림", background: "#f7f0d8", surface: "#fbf6e7", border: "#ddd2ad", text: "#373022", muted: "#7a6f57" },
  { id: "apricot", name: "애프리콧", background: "#f8e3c5", surface: "#fdf0dd", border: "#e1c08e", text: "#3a2815", muted: "#7d6242" },
  { id: "aqua", name: "아쿠아", background: "#d9f3ef", surface: "#e8faf6", border: "#afd9d1", text: "#153632", muted: "#567b76" },
  { id: "lilac", name: "라일락", background: "#efe6f7", surface: "#f7f1fb", border: "#d1c1df", text: "#30223b", muted: "#746481" },
  { id: "sand", name: "샌드", background: "#efe3d4", surface: "#f7efe5", border: "#d4bfaa", text: "#34271f", muted: "#756255" },
];

export const DEFAULT_CARD_THEME_ID: CardThemeId = "butter";

export function getCardTheme(themeId?: CardThemeId) {
  return CARD_THEMES.find((theme) => theme.id === themeId) ?? CARD_THEMES[0];
}
