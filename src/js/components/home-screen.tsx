"use client";

import { useEffect, useMemo, useState } from "react";

import { CardItem } from "@/components/card-item";
import { cardRepository } from "@/lib/repository";
import { useReadingCards } from "@/lib/hooks/use-reading-cards";
import { Visibility } from "@/lib/types";

const segments: Array<{ label: string; value: Visibility }> = [
  { label: "Only Me", value: "alone" },
  { label: "With Friend", value: "friend" },
  { label: "Share All", value: "public" },
];

export function HomeScreen({ mode = "home" }: { mode?: "home" | "offline" | "mine" }) {
  const { cards, isLoading, error, removeCard, refresh } = useReadingCards();
  const [segment, setSegment] = useState<Visibility>("alone");
  const [selectedSyncIds, setSelectedSyncIds] = useState<string[]>([]);
  const [selectedShareIds, setSelectedShareIds] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const visibleCards = useMemo(() => {
    if (mode === "offline") {
      return cards.filter((card) => card.sync_status !== "synced");
    }

    if (mode === "mine") {
      return cards;
    }

    return cards.filter(
      (card) => (card.visibility ?? "alone") === segment && card.read_status !== "offline",
    );
  }, [cards, mode, segment]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncOnlineState = () => setIsOnline(window.navigator.onLine);
    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  function toggleSyncSelection(localId: string) {
    setSelectedSyncIds((current) =>
      current.includes(localId) ? current.filter((item) => item !== localId) : [...current, localId],
    );
  }

  async function handleMoveSelectedOnline() {
    if (!isOnline || selectedSyncIds.length === 0) {
      return;
    }

    await cardRepository.moveOfflineCardsOnline(selectedSyncIds);
    setSelectedSyncIds([]);
    await refresh();
  }

  function toggleShareSelection(localId: string) {
    setSelectedShareIds((current) =>
      current.includes(localId) ? current.filter((item) => item !== localId) : [...current, localId],
    );
  }

  async function handleChangeVisibility(visibility: Visibility) {
    await Promise.all(selectedShareIds.map((localId) => cardRepository.updateVisibility(localId, visibility)));
    setSelectedShareIds([]);
    setSegment(visibility);
    await refresh();
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {mode === "home" || mode === "mine" ? (
        <section className="px-1 pt-[5px]">
          <div className="grid grid-cols-3 overflow-hidden rounded-full border border-line bg-surface">
            {segments.map((item) => {
              const active = item.value === segment;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSegment(item.value)}
                  className={`px-2 py-1.5 text-sm font-semibold transition ${
                    active ? "bg-[#23252c] text-ink" : "bg-transparent text-muted"
                  }`}
                  style={{
                    borderRight: item.value !== "public" ? "1px solid #2b2d34" : "none",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex min-h-[1.5rem] items-center justify-end gap-3 pr-1">
            {selectedShareIds.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void handleChangeVisibility("alone");
                  }}
                  className="text-sm font-semibold text-[#d1d5db]"
                >
                  Only Me
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleChangeVisibility("friend");
                  }}
                  className="text-sm font-semibold text-[#93c5fd]"
                >
                  Friends
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleChangeVisibility("public");
                  }}
                  className="text-sm font-semibold text-[#f9a8d4]"
                >
                  Share
                </button>
              </>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="px-4 py-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">Offline</p>
          <h2 className="mt-2 text-xl font-semibold text-muted">오프라인 독서카드</h2>
          <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-5 text-muted">
            이곳은 인터넷 없이 저장한 독서카드를 확인하는 공간입니다. 온라인이 되면 이후 단계에서 서버와 다시 맞출 수 있게 확장할 수 있습니다.
          </p>
          <div className="mt-3 flex min-h-[1.5rem] items-center justify-end pr-1">
            {selectedSyncIds.length > 0 ? (
              isOnline ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleMoveSelectedOnline();
                  }}
                  className="text-sm font-semibold text-[#22c55e]"
                >
                  DB update
                </button>
              ) : (
                <p className="text-xs leading-5 text-muted">
                  온라인 상태에서만 선택한 카드를 DB update 할 수 있습니다.
                </p>
              )
            ) : null}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-card border border-line bg-surface" />
          ))}
        </div>
      ) : null}

      {!isLoading && visibleCards.length === 0 ? (
        <section className="rounded-[1.75rem] border border-line bg-[#2b2d34] px-5 py-10 text-center shadow-card">
          <p className="text-base font-semibold text-ink">
            {mode === "offline" ? "오프라인 카드가 아직 없습니다." : "이 구간에는 아직 카드가 없습니다."}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {mode === "offline" ? "인터넷 없이 작성한 카드가 여기에 쌓입니다." : "공개 범위를 바꾸거나 새 카드를 만들어 보세요."}
          </p>
        </section>
      ) : null}

      {visibleCards.length > 0 ? (
        <div className="space-y-4">
          {visibleCards.map((card) => (
            <CardItem
              key={card.local_id}
              card={card}
              onDelete={removeCard}
              variant={mode === "offline" ? "offline" : mode === "mine" ? "mine" : "default"}
              syncSelected={selectedSyncIds.includes(card.local_id)}
              onToggleSync={mode === "offline" ? toggleSyncSelection : undefined}
              shareSelected={selectedShareIds.includes(card.local_id)}
              onToggleShare={mode === "home" || mode === "mine" ? toggleShareSelection : undefined}
              href={
                mode === "offline"
                  ? `/cards/${card.local_id}/edit?returnTo=offline`
                  : `/cards/${card.local_id}/edit`
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
