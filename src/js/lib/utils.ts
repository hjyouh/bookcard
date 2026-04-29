import { DEFAULT_CARD_THEME_ID } from "@/lib/card-themes";
import { CardAttachment, CardDraft, ReadStatus, ReadingCard, SyncStatus, Visibility } from "@/lib/types";

export const APP_NAME = "나의 독서 카드";

export function createId(prefix = "card") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeKeywords(raw: string) {
  return raw
    .split(/[,\s]+/)
    .map((item) => item.trim().replace(/^#+/, ""))
    .filter(Boolean);
}

export function keywordsToText(keywords: string[]) {
  return keywords.map((keyword) => `#${keyword.replace(/^#+/, "")}`).join(" ");
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

export function visibilityLabel(value: Visibility) {
  switch (value) {
    case "alone":
      return "나만 보기";
    case "friend":
      return "친구 공유";
    case "public":
      return "전체 공개";
  }
}

export function readStatusLabel(value: ReadStatus) {
  switch (value) {
    case "offline":
      return "오프라인";
    case "unread":
      return "미독";
    case "reading":
      return "읽는 중";
    case "read":
      return "완료";
  }
}

export function syncStatusLabel(value: SyncStatus) {
  switch (value) {
    case "synced":
      return "동기화 완료";
    case "pending_create":
      return "생성 대기";
    case "pending_update":
      return "수정 대기";
    case "pending_delete":
      return "삭제 대기";
    case "sync_error":
      return "동기화 오류";
  }
}

export function createEmptyDraft(): CardDraft {
  return {
    title: "",
    author: "",
    book_title: "",
    question: "",
    keywords: "",
    memo: "",
    purchase_link: "",
    summary: "",
    action_note: "",
    attachments: [],
    color_theme: DEFAULT_CARD_THEME_ID,
    visibility: "alone",
    read_status: "reading",
  };
}

export function draftToCard(draft: CardDraft, existing?: ReadingCard): ReadingCard {
  const timestamp = nowIso();
  const baseCreatedAt = existing?.created_at ?? timestamp;
  const localId = existing?.local_id ?? createId("local");

  return {
    id: existing?.id ?? localId,
    owner_id: existing?.owner_id ?? null,
    local_id: localId,
    title: draft.title.trim() || draft.book_title.trim() || "제목 없는 카드",
    author: draft.author.trim(),
    book_title: draft.book_title.trim(),
    question: draft.question.trim(),
    keywords: normalizeKeywords(draft.keywords),
    memo: draft.memo.trim(),
    purchase_link: draft.purchase_link.trim(),
    summary: draft.summary.trim(),
    action_note: draft.action_note.trim(),
    attachments: draft.attachments,
    color_theme: draft.color_theme,
    visibility: draft.visibility,
    read_status: draft.read_status,
    created_at: baseCreatedAt,
    updated_at: timestamp,
    deleted_at: null,
    sync_status: existing ? "pending_update" : "pending_create",
  };
}

export function cardToDraft(card: ReadingCard): CardDraft {
  return {
    title: card.title,
    author: card.author,
    book_title: card.book_title,
    question: card.question,
    keywords: keywordsToText(card.keywords),
    memo: card.memo,
    purchase_link: card.purchase_link ?? "",
    summary: card.summary,
    action_note: card.action_note,
    attachments: card.attachments ?? [],
    color_theme: card.color_theme ?? DEFAULT_CARD_THEME_ID,
    visibility: card.visibility,
    read_status: card.read_status,
  };
}

export function createAttachment(name: string, type: string, dataUrl: string): CardAttachment {
  return {
    id: createId("attachment"),
    name,
    type,
    dataUrl,
    created_at: nowIso(),
  };
}

export function matchesSearch(card: ReadingCard, query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return true;
  }

  const haystack = [
    card.title,
    card.author,
    card.book_title,
    card.question,
    card.memo,
    card.purchase_link,
    card.summary,
    card.action_note,
    card.keywords.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(keyword);
}
