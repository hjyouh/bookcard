"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CardItem } from "@/components/card-item";
import { EmptyState } from "@/components/empty-state";
import { cardRepository } from "@/lib/repository";
import { ReadingCard } from "@/lib/types";

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReadingCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      const items = query.trim() ? await cardRepository.search(query) : [];
      if (!cancelled) {
        setResults(items);
        setIsLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [query]);

  async function handleDelete(localId: string) {
    await cardRepository.remove(localId);
    setResults((current) => current.filter((card) => card.local_id !== localId));
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.5rem] border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 책 제목, 키워드, 메모, 요약 검색"
            className="h-12 flex-1 rounded-2xl border border-line px-4 text-base outline-none"
          />
          <Link
            href="/"
            className="inline-flex h-12 shrink-0 items-center rounded-2xl border border-line px-4 text-sm font-medium text-muted"
          >
            종료
          </Link>
        </div>
      </section>

      {!query.trim() ? (
        <EmptyState title="검색어를 입력해 주세요." description="로컬에 저장된 독서카드에서 제목, 메모, 키워드까지 한 번에 검색합니다." />
      ) : null}

      {query.trim() && isLoading ? <div className="text-sm text-muted">검색 중...</div> : null}

      {query.trim() && !isLoading && results.length === 0 ? (
        <EmptyState title="검색 결과가 없습니다." description="다른 키워드로 다시 검색해 보세요." />
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((card) => (
            <CardItem key={card.local_id} card={card} onDelete={handleDelete} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
