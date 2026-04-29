"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { getCardTheme } from "@/lib/card-themes";
import { ReadingCard } from "@/lib/types";
import { readStatusLabel, visibilityLabel } from "@/lib/utils";

interface CardItemProps {
  card: ReadingCard;
  onDelete: (localId: string) => Promise<void>;
  variant?: "default" | "offline" | "mine";
  href?: string;
  syncSelected?: boolean;
  onToggleSync?: (localId: string) => void;
  shareSelected?: boolean;
  onToggleShare?: (localId: string) => void;
}

export function CardItem({
  card,
  onDelete,
  variant = "default",
  href,
  syncSelected = false,
  onToggleSync,
  shareSelected = false,
  onToggleShare,
}: CardItemProps) {
  const router = useRouter();
  const [startX, setStartX] = useState<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const dateLabel = useMemo(() => {
    const date = new Date(card.updated_at);
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  }, [card.updated_at]);

  const timeLabel = useMemo(() => {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(card.updated_at));
  }, [card.updated_at]);

  const theme = getCardTheme(card.color_theme);
  const isOfflineStyled = variant === "offline" || (variant === "mine" && card.read_status === "offline");
  const cardBackground = isOfflineStyled ? "#2b2d34" : theme.background;
  const titleColor = isOfflineStyled ? "#f5f5f7" : theme.text;
  const bodyColor = isOfflineStyled ? "#d3d5dc" : theme.muted;
  const metaColor = isOfflineStyled ? "#b8bbc6" : theme.text;
  const borderColor = isOfflineStyled ? "#4a4e59" : theme.border;
  const stateText = isOfflineStyled ? "오프라인" : readStatusLabel(card.read_status);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete(card.local_id);
    } finally {
      setIsDeleting(false);
      setOffsetX(0);
    }
  }

  function handleOpenCard() {
    router.push(href ?? `/cards/${card.local_id}/edit`);
  }

  return (
    <div className="relative overflow-hidden rounded-[1.15rem]">
      <button
        type="button"
        onClick={() => {
          void handleDelete();
        }}
        disabled={isDeleting}
        className="absolute inset-y-0 right-0 inline-flex w-20 items-center justify-center rounded-r-[1.15rem] bg-red-500 text-sm font-semibold text-white transition-opacity"
        style={{ opacity: offsetX < -8 ? 1 : 0 }}
      >
        {isDeleting ? "삭제중" : "휴지통"}
      </button>

      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenCard}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleOpenCard();
          }
        }}
        onTouchStart={(event) => {
          setStartX(event.touches[0]?.clientX ?? null);
        }}
        onTouchMove={(event) => {
          if (startX === null) {
            return;
          }

          const distance = (event.touches[0]?.clientX ?? startX) - startX;
          setOffsetX(Math.max(-80, Math.min(0, distance)));
        }}
        onTouchEnd={() => {
          setOffsetX((current) => (current < -40 ? -80 : 0));
          setStartX(null);
        }}
        className="relative block w-full rounded-[1.15rem] px-0 py-0 text-left transition"
        style={{
          transform: `translateX(${offsetX}px)`,
          backgroundColor: cardBackground,
          boxShadow: "0 20px 38px rgba(0, 0, 0, 0.16)",
          border: `1px solid ${borderColor}`,
        }}
      >
        <div className="grid min-h-[84px] grid-cols-[88px_minmax(0,1fr)_96px] items-stretch">
          <div className="flex flex-col items-center justify-center px-2 py-2">
            <p className="text-[14px] font-semibold tracking-[-0.03em]" style={{ color: titleColor }}>{dateLabel}</p>
            <p className="text-[13px]" style={{ color: metaColor }}>{timeLabel}</p>
          </div>

          <div className="flex min-w-0 flex-col items-center justify-center px-2 py-2 text-center">
              <h2 className="line-clamp-1 text-[18px] font-semibold leading-5" style={{ color: titleColor }}>
                {card.book_title || card.title || "제목 없는 카드"}
              </h2>
            <p className="mt-0.5 line-clamp-2 text-[14px] leading-5" style={{ color: bodyColor }}>
              {card.question || card.summary || card.memo || "내용을 열어 자세히 볼 수 있습니다."}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-center">
            <p className="text-[14px] font-semibold leading-5" style={{ color: metaColor }}>{visibilityLabel(card.visibility)}</p>
            <p className="text-[14px] font-semibold leading-5" style={{ color: titleColor }}>{stateText}</p>
            {variant === "offline" ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSync?.(card.local_id);
                }}
                className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-full border px-1.5 transition"
                style={{
                  borderColor: syncSelected ? "#22c55e" : "#666b77",
                  borderWidth: "1px",
                  backgroundColor: syncSelected ? "#22c55e" : "transparent",
                }}
                aria-label="DB update 선택"
              />
            ) : onToggleShare ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleShare(card.local_id);
                }}
                className="mt-0.5 inline-flex h-5 min-w-[30px] items-center justify-center rounded-full border px-2 text-[10px] font-semibold transition"
                style={{
                  borderColor: shareSelected ? "#22c55e" : borderColor,
                  color: shareSelected ? "#0b3b20" : bodyColor,
                  backgroundColor: shareSelected ? "#22c55e" : "rgba(255,255,255,0.4)",
                }}
                aria-label="공개 범위 선택"
              >
                O
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
