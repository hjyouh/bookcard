"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getCardTheme } from "@/lib/card-themes";
import { EmptyState } from "@/components/empty-state";
import { cardRepository } from "@/lib/repository";
import { ReadingCard } from "@/lib/types";
import { formatDate, readStatusLabel, syncStatusLabel, visibilityLabel } from "@/lib/utils";

interface CardDetailScreenProps {
  localId: string;
}

export function CardDetailScreen({ localId }: CardDetailScreenProps) {
  const [card, setCard] = useState<ReadingCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const found = await cardRepository.get(localId);
      if (!cancelled) {
        setCard(found ?? null);
        setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [localId]);

  if (isLoading) {
    return <div className="rounded-card border border-line bg-surface p-6 text-sm text-muted">불러오는 중...</div>;
  }

  if (!card || card.deleted_at) {
    return (
      <EmptyState
        title="카드를 찾을 수 없습니다."
        description="이미 삭제되었거나 로컬 데이터에서 사라진 카드입니다."
      />
    );
  }

  const theme = getCardTheme(card.color_theme);

  return (
    <article className="space-y-4">
      <section
        className="rounded-[1.5rem] p-5 shadow-card"
        style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium" style={{ color: theme.muted }}>{formatDate(card.updated_at)} 수정</p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight" style={{ color: theme.text }}>{card.title}</h2>
            <p className="mt-2 text-sm" style={{ color: theme.muted }}>
              {card.book_title || "책 제목 미입력"} · {card.author || "저자 미입력"}
            </p>
          </div>
          <Link
            href={`/cards/${card.local_id}/edit`}
            className="rounded-full px-4 py-2 text-sm font-medium"
            style={{ border: `1px solid ${theme.border}`, color: theme.muted }}
          >
            수정
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge label={readStatusLabel(card.read_status)} theme={theme} />
          <Badge label={visibilityLabel(card.visibility)} theme={theme} />
          <Badge label={syncStatusLabel(card.sync_status)} theme={theme} />
        </div>
      </section>

      <DetailBlock title="핵심 질문" content={card.question} theme={theme} />
      <DetailBlock title="키워드" content={card.keywords.join(", ")} theme={theme} />
      <DetailBlock title="메모" content={card.memo} theme={theme} />
      <DetailBlock title="도서 구매" content={card.purchase_link} theme={theme} isLink />
      <DetailBlock title="한 줄 요약" content={card.summary} theme={theme} />
      <DetailBlock title="적용할 것" content={card.action_note} theme={theme} />
      <AttachmentBlock imageUrls={card.attachments} theme={theme} />
    </article>
  );
}

function DetailBlock({
  title,
  content,
  theme,
  isLink = false,
}: {
  title: string;
  content: string;
  theme: ReturnType<typeof getCardTheme>;
  isLink?: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] p-5 shadow-card" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface }}>
      <h3 className="text-sm font-semibold" style={{ color: theme.text }}>{title}</h3>
      {isLink && content ? (
        <a href={content} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm leading-7 text-blue-700 underline">
          {content}
        </a>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7" style={{ color: theme.muted }}>
          {content || "아직 입력된 내용이 없습니다."}
        </p>
      )}
    </section>
  );
}

function Badge({ label, theme }: { label: string; theme: ReturnType<typeof getCardTheme> }) {
  return (
    <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: theme.background, color: theme.text }}>
      {label}
    </span>
  );
}

function AttachmentBlock({
  imageUrls,
  theme,
}: {
  imageUrls: ReadingCard["attachments"];
  theme: ReturnType<typeof getCardTheme>;
}) {
  if (!imageUrls || imageUrls.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] p-5 shadow-card" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface }}>
      <h3 className="text-sm font-semibold" style={{ color: theme.text }}>첨부 이미지</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {imageUrls.map((attachment) => (
          <img
            key={attachment.id}
            src={attachment.dataUrl}
            alt={attachment.name}
            className="w-full rounded-2xl object-cover"
            style={{ border: `1px solid ${theme.border}` }}
          />
        ))}
      </div>
    </section>
  );
}
