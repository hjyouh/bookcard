"use client";

import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface px-5 py-10 text-center shadow-card">
      <p className="text-base font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      <Link
        href="/cards/new"
        className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-background"
      >
        첫 카드 만들기
      </Link>
    </div>
  );
}
