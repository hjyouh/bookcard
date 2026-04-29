"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CardForm } from "@/components/card-form";
import { cardRepository } from "@/lib/repository";
import { CardDraft } from "@/lib/types";
import { cardToDraft } from "@/lib/utils";

interface CardEditorScreenProps {
  localId?: string;
}

export function CardEditorScreen({ localId }: CardEditorScreenProps) {
  const router = useRouter();
  const [initialValue, setInitialValue] = useState<CardDraft | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(Boolean(localId));
  const [error, setError] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [showMovePrompt, setShowMovePrompt] = useState(false);
  const [stayPath, setStayPath] = useState<string | null>(null);
  const offlineMode = returnTo === "offline";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const nextReturnTo = searchParams.get("returnTo");
      const shouldPrompt = searchParams.get("prompt") === "1";
      setReturnTo(nextReturnTo);

      if (localId) {
        setStayPath(
          nextReturnTo === "offline"
            ? `/cards/${localId}/edit?returnTo=offline`
            : `/cards/${localId}/edit`,
        );
      }

      if (localId && shouldPrompt) {
        setShowMovePrompt(true);
      }
    }
  }, [localId]);

  useEffect(() => {
    if (!localId) {
      return;
    }

    const currentLocalId = localId;
    let cancelled = false;

    async function loadCard() {
      try {
        setIsLoading(true);
        const card = await cardRepository.get(currentLocalId);

        if (!card || cancelled) {
          return;
        }

        setInitialValue(cardToDraft(card));
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "카드를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCard();

    return () => {
      cancelled = true;
    };
  }, [localId]);

  async function handleSubmit(draft: CardDraft) {
    const nextPath = returnTo === "offline" ? "/offline" : "/";

    if (localId) {
      await cardRepository.update(localId, draft);
      if (offlineMode) {
        setStayPath(`/cards/${localId}/edit?returnTo=offline`);
        setShowMovePrompt(true);
      } else {
        router.push(nextPath);
        router.refresh();
      }
      return;
    }

    const card = await cardRepository.create(draft);

    if (offlineMode) {
      const editPath = `/cards/${card.local_id}/edit?returnTo=offline`;
      setStayPath(editPath);
      setShowMovePrompt(true);
    } else {
      router.push(nextPath);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!localId) {
      return;
    }

    await cardRepository.remove(localId);
    router.push("/");
    router.refresh();
  }

  if (isLoading) {
    return <div className="rounded-card border border-line bg-surface p-6 text-sm text-muted">불러오는 중...</div>;
  }

  if (error) {
    return <div className="rounded-card border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  }

  return (
    <section>
      <CardForm
        initialValue={initialValue}
        onSubmit={handleSubmit}
        onDelete={localId ? handleDelete : undefined}
        submitLabel={localId ? "수정 저장" : "카드 저장"}
        offlineMode={offlineMode}
      />
      {showMovePrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="w-full max-w-sm rounded-[1.5rem] border border-line bg-surface p-5 shadow-card">
            <h3 className="text-center text-lg font-semibold text-ink">오프라인 화면으로 이동할까요?</h3>
            <p className="mt-2 text-center text-sm leading-6 text-muted">
              카드는 저장되었습니다.
              <br />
              취소하면 지금 작성한 카드 화면에 그대로 머물고,
              <br />
              이동하면 오프라인 목록으로 돌아갑니다.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowMovePrompt(false);
                  if (stayPath) {
                    router.replace(stayPath);
                  }
                }}
                className="inline-flex h-7 items-center justify-center rounded-2xl border border-line text-sm font-semibold text-ink"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMovePrompt(false);
                  router.push("/offline");
                  router.refresh();
                }}
                className="inline-flex h-7 items-center justify-center rounded-2xl bg-ink text-sm font-semibold text-background"
              >
                네
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
