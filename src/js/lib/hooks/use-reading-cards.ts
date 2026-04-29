"use client";

import { useEffect, useState } from "react";

import { cardRepository } from "@/lib/repository";
import { CardDraft, ReadingCard } from "@/lib/types";

export function useReadingCards() {
  const [cards, setCards] = useState<ReadingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setIsLoading(true);
      const nextCards = await cardRepository.list();
      setCards(nextCards);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "카드를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createCard(draft: CardDraft) {
    await cardRepository.create(draft);
    await refresh();
  }

  async function updateCard(localId: string, draft: CardDraft) {
    await cardRepository.update(localId, draft);
    await refresh();
  }

  async function removeCard(localId: string) {
    await cardRepository.remove(localId);
    await refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return {
    cards,
    isLoading,
    error,
    refresh,
    createCard,
    updateCard,
    removeCard,
  };
}
