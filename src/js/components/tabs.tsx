"use client";

import { CardTab } from "@/lib/types";

const items: Array<{ key: CardTab; label: string; disabled?: boolean }> = [
  { key: "mine", label: "내 카드" },
  { key: "shared", label: "공유받은 카드", disabled: true },
  { key: "public", label: "전체 공개 카드", disabled: true },
];

interface TabsProps {
  value: CardTab;
  onChange: (value: CardTab) => void;
}

export function Tabs({ value, onChange }: TabsProps) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => !item.disabled && onChange(item.key)}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            value === item.key ? "bg-accent text-white" : "border border-line bg-surface text-muted"
          } ${item.disabled ? "opacity-50" : ""}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
