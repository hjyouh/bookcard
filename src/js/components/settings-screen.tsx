"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { PropsWithChildren } from "react";

import { exportBackup, getSettings, importBackup, saveSettings } from "@/lib/db";
import { AppSettings } from "@/lib/types";
import { nowIso } from "@/lib/utils";

const defaultSettings: AppSettings = {
  autoSyncEnabled: false,
  updatedAt: "",
};

export function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const loaded = await getSettings();
      setSettings(loaded);
    }

    void load();
  }, []);

  async function toggleAutoSync() {
    const next = {
      autoSyncEnabled: !settings.autoSyncEnabled,
      updatedAt: nowIso(),
    };

    setSettings(next);
    await saveSettings(next);
    setMessage("자동 동기화 설정을 저장했습니다. 실제 자동 동기화는 Phase 5에서 연결됩니다.");
  }

  async function handleExport() {
    const payload = await exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `reading-cards-backup-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("로컬 데이터 백업 파일을 내보냈습니다.");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const payload = JSON.parse(text);
    await importBackup(payload);
    setMessage("로컬 데이터 가져오기를 완료했습니다. 홈으로 돌아가 목록을 확인해 주세요.");
    event.target.value = "";
  }

  return (
    <div className="space-y-4">
      <Section title="계정">
        <p className="text-sm leading-6 text-muted">
          Phase 1에서는 비로그인 로컬 모드로 동작합니다. Supabase Auth 로그인은 Phase 2에서 연결됩니다.
        </p>
      </Section>

      <Section title="동기화">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">자동 동기화</p>
            <p className="mt-1 text-sm text-muted">지금은 설정만 저장되고, 실제 동작은 다음 단계에서 구현됩니다.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void toggleAutoSync();
            }}
            className={`inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold ${
              settings.autoSyncEnabled ? "bg-accent text-white" : "border border-line text-muted"
            }`}
          >
            {settings.autoSyncEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </Section>

      <Section title="백업">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              void handleExport();
            }}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-4 text-sm font-semibold text-white"
          >
            로컬 데이터 백업 내보내기
          </button>
          <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-line px-4 text-sm font-medium text-muted">
            로컬 데이터 가져오기
            <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </Section>

      <Section title="앱 정보">
        <p className="text-sm leading-6 text-muted">
          오프라인 우선 독서카드 앱 Phase 1
          <br />
          IndexedDB 기반 로컬 저장, 검색, 수정, 삭제, PWA 설치 지원
        </p>
      </Section>

      {message ? <div className="rounded-card border border-line bg-surface px-4 py-3 text-sm text-muted shadow-card">{message}</div> : null}
    </div>
  );
}

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="rounded-[1.5rem] border border-line bg-surface p-5 shadow-card">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
