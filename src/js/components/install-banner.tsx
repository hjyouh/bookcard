"use client";

import { useState } from "react";

import { usePwaInstall } from "@/lib/hooks/use-pwa-install";

export function InstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed || !canInstall) {
    return null;
  }

  return (
    <section className="mb-4 rounded-card border border-line bg-surface p-4 shadow-card">
      <p className="text-sm font-semibold text-ink">홈 화면에 추가해서 앱처럼 사용해 보세요.</p>
      <p className="mt-1 text-sm text-muted">
        한 번 설치하면 네트워크가 끊겨도 저장된 독서카드를 더 빠르게 열 수 있습니다.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            void promptInstall();
          }}
          className="inline-flex h-11 items-center rounded-full bg-ink px-4 text-sm font-semibold text-background"
        >
          설치하기
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex h-11 items-center rounded-full border border-line px-4 text-sm font-medium text-muted"
        >
          나중에
        </button>
      </div>
    </section>
  );
}
