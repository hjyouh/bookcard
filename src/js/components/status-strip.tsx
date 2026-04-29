"use client";

import { useOnlineStatus } from "@/lib/hooks/use-online-status";

export function StatusStrip() {
  const isOnline = useOnlineStatus();

  return (
    <div className="mb-4 flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3 shadow-card">
      <div>
        <p className="text-sm font-semibold">{isOnline ? "온라인 상태" : "오프라인 상태"}</p>
        <p className="text-xs text-muted">
          {isOnline ? "로컬에서 계속 작성 가능하며 이후 동기화 구조로 확장됩니다." : "인터넷 없이도 저장된 카드를 계속 편집할 수 있습니다."}
        </p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          isOnline ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-700"
        }`}
      >
        {isOnline ? "ONLINE" : "OFFLINE"}
      </span>
    </div>
  );
}
