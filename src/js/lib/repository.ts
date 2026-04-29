"use client";

import { deleteCard, getCardByLocalId, listCards, saveCard, searchCards } from "@/lib/db";
import { CardDraft } from "@/lib/types";
import { draftToCard, nowIso } from "@/lib/utils";

export const cardRepository = {
  async list() {
    return listCards();
  },

  async get(localId: string) {
    return getCardByLocalId(localId);
  },

  async search(query: string) {
    return searchCards(query);
  },

  async create(draft: CardDraft) {
    const card = draftToCard(draft);
    await saveCard(card);
    return card;
  },

  async update(localId: string, draft: CardDraft) {
    const existing = await getCardByLocalId(localId);
    if (!existing) {
      throw new Error("카드를 찾을 수 없습니다.");
    }

    const updated = draftToCard(draft, existing);
    await saveCard(updated);
    return updated;
  },

  async updateVisibility(localId: string, visibility: CardDraft["visibility"]) {
    const existing = await getCardByLocalId(localId);
    if (!existing) {
      throw new Error("카드를 찾을 수 없습니다.");
    }

    const updated = {
      ...existing,
      visibility,
      updated_at: nowIso(),
      sync_status: existing.sync_status === "synced" ? "pending_update" : existing.sync_status,
    };

    await saveCard(updated);
    return updated;
  },

  async remove(localId: string) {
    return deleteCard(localId);
  },

  async moveOfflineCardsOnline(localIds: string[]) {
    const updated = await Promise.all(
      localIds.map(async (localId) => {
        const existing = await getCardByLocalId(localId);
        if (!existing) {
          return null;
        }

        const next = {
          ...existing,
          read_status: "reading" as const,
          sync_status: "synced" as const,
          updated_at: nowIso(),
        };

        await saveCard(next);
        return next;
      }),
    );

    return updated.filter(Boolean);
  },
};
