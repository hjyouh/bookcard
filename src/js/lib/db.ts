"use client";

import { DEFAULT_CARD_THEME_ID } from "@/lib/card-themes";
import { AppSettings, BackupPayload, ReadingCard } from "@/lib/types";
import { matchesSearch, nowIso } from "@/lib/utils";

const DB_NAME = "reading-cards-db";
const DB_VERSION = 1;
const CARD_STORE = "cards";
const SETTINGS_STORE = "settings";
const SETTINGS_KEY = "app_settings";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(CARD_STORE)) {
        const cardStore = db.createObjectStore(CARD_STORE, { keyPath: "local_id" });
        cardStore.createIndex("updated_at", "updated_at");
        cardStore.createIndex("deleted_at", "deleted_at");
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function promisify<T = unknown>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => Promise<T>,
) {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const result = await runner(store);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

  return result;
}

const legacySampleBooks = new Set(["여행의 이유", "아주 작은 습관의 힘"]);

async function removeLegacySampleCards() {
  await transaction(CARD_STORE, "readwrite", async (store) => {
    const cards = await promisify<ReadingCard[]>(store.getAll());
    const legacyCards = cards.filter(
      (card) =>
        !card.owner_id &&
        !card.attachments?.length &&
        legacySampleBooks.has(card.book_title) &&
        card.sync_status === "pending_create",
    );

    await Promise.all(legacyCards.map((card) => promisify(store.delete(card.local_id))));
    return undefined;
  });
}

function normalizeCard(card: ReadingCard): ReadingCard {
  return {
    ...card,
    attachments: card.attachments ?? [],
    purchase_link: card.purchase_link ?? "",
    color_theme: card.color_theme ?? DEFAULT_CARD_THEME_ID,
  };
}

export async function getAllCards() {
  const rows = await transaction(CARD_STORE, "readonly", (store) => promisify<ReadingCard[]>(store.getAll()));

  return rows
    .map(normalizeCard)
    .filter((card) => !card.deleted_at)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function listCards() {
  await removeLegacySampleCards();
  return getAllCards();
}

export async function getCardByLocalId(localId: string) {
  const card = await transaction(CARD_STORE, "readonly", (store) =>
    promisify<ReadingCard | undefined>(store.get(localId)),
  );

  return card ? normalizeCard(card) : undefined;
}

export async function saveCard(card: ReadingCard) {
  return transaction(CARD_STORE, "readwrite", (store) => promisify(store.put(normalizeCard(card))));
}

export async function deleteCard(localId: string) {
  const card = await getCardByLocalId(localId);
  if (!card) {
    return null;
  }

  const deleted: ReadingCard = {
    ...card,
    deleted_at: nowIso(),
    updated_at: nowIso(),
    sync_status: "pending_delete",
  };

  await saveCard(deleted);
  return deleted;
}

export async function searchCards(query: string) {
  const cards = await getAllCards();
  return cards.filter((card) => matchesSearch(card, query));
}

export async function getSettings(): Promise<AppSettings> {
  const item = await transaction(SETTINGS_STORE, "readonly", (store) =>
    promisify<{ id: string } & AppSettings | undefined>(store.get(SETTINGS_KEY)),
  );

  return (
    item ?? {
      autoSyncEnabled: false,
      updatedAt: nowIso(),
    }
  );
}

export async function saveSettings(settings: AppSettings) {
  return transaction(SETTINGS_STORE, "readwrite", (store) =>
    promisify(store.put({ id: SETTINGS_KEY, ...settings })),
  );
}

export async function exportBackup(): Promise<BackupPayload> {
  const [cards, settings] = await Promise.all([getAllCards(), getSettings()]);

  return {
    version: 1,
    exportedAt: nowIso(),
    cards,
    settings,
  };
}

export async function importBackup(payload: BackupPayload) {
  await transaction(CARD_STORE, "readwrite", async (store) => {
    const clearRequest = store.clear();
    await promisify(clearRequest);

    await Promise.all(payload.cards.map((card) => promisify(store.put(normalizeCard(card)))));
    return undefined;
  });

  await saveSettings(payload.settings);
}
