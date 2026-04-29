export type SyncStatus =
  | "synced"
  | "pending_create"
  | "pending_update"
  | "pending_delete"
  | "sync_error";

export type Visibility = "alone" | "friend" | "public";
export type ReadStatus = "unread" | "reading" | "read" | "offline";
export type CardTab = "mine" | "shared" | "public";
export type CardThemeId =
  | "butter"
  | "mint"
  | "peach"
  | "sky"
  | "lavender"
  | "rose"
  | "sage"
  | "cream"
  | "apricot"
  | "aqua"
  | "lilac"
  | "sand";

export interface ReadingCard {
  id: string;
  owner_id: string | null;
  local_id: string;
  title: string;
  author: string;
  book_title: string;
  question: string;
  keywords: string[];
  memo: string;
  purchase_link: string;
  summary: string;
  action_note: string;
  attachments?: CardAttachment[];
  color_theme?: CardThemeId;
  visibility: Visibility;
  read_status: ReadStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: SyncStatus;
}

export interface CardAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  created_at: string;
}

export interface CardDraft {
  title: string;
  author: string;
  book_title: string;
  question: string;
  keywords: string;
  memo: string;
  purchase_link: string;
  summary: string;
  action_note: string;
  attachments: CardAttachment[];
  color_theme: CardThemeId;
  visibility: Visibility;
  read_status: ReadStatus;
}

export interface SearchResult {
  items: ReadingCard[];
  query: string;
}

export interface AppSettings {
  autoSyncEnabled: boolean;
  updatedAt: string;
}

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  cards: ReadingCard[];
  settings: AppSettings;
}
