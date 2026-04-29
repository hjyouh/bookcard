"use client";

import {
  FormEvent,
  KeyboardEvent,
  PropsWithChildren,
  ReactNode,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";

import { getCardTheme } from "@/lib/card-themes";
import { CARD_THEME_EVENT, getStoredCardTheme } from "@/lib/card-theme-client";
import { CardDraft } from "@/lib/types";
import { createAttachment, createEmptyDraft } from "@/lib/utils";

interface CardFormProps {
  initialValue?: CardDraft;
  onSubmit: (draft: CardDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitLabel?: string;
  offlineMode?: boolean;
}

export function CardForm({
  initialValue,
  onSubmit,
  onDelete,
  submitLabel = "저장",
  offlineMode = false,
}: CardFormProps) {
  const [draft, setDraft] = useState<CardDraft>(initialValue ?? createEmptyDraft());
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [isLinkVerified, setIsLinkVerified] = useState(false);

  useEffect(() => {
    if (initialValue) {
      return;
    }

    setDraft((current) => ({ ...current, color_theme: getStoredCardTheme() }));
  }, [initialValue]);

  useEffect(() => {
    const handler = (event: Event) => {
      const themeId = (event as CustomEvent<string>).detail;
      setDraft((current) => ({ ...current, color_theme: themeId as CardDraft["color_theme"] }));
    };

    window.addEventListener(CARD_THEME_EVENT, handler);
    return () => window.removeEventListener(CARD_THEME_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!offlineMode) {
      return;
    }

    setDraft((current) => ({ ...current, read_status: "offline" }));
  }, [offlineMode]);

  const theme = getCardTheme(draft.color_theme);
  const labelColor = "#7a7a7a";
  const inputColor = "#325aa6";

  function updateField<Key extends keyof CardDraft>(key: Key, value: CardDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleVerifyLink() {
    const purchaseLink = draft.purchase_link.trim();
    if (!purchaseLink) {
      setIsLinkVerified(false);
      return;
    }

    setIsCheckingLink(true);
    const verified = await verifyLink(purchaseLink);
    setIsLinkVerified(verified);
    setIsCheckingLink(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const remain = 3 - draft.attachments.length;
    if (remain <= 0) {
      setImageError("이미지는 최대 3장까지 첨부할 수 있습니다.");
      return;
    }

    const nextFiles = Array.from(files).slice(0, remain);
    const attachments = await Promise.all(
      nextFiles.map(async (file) => {
        const dataUrl = await fileToDataUrl(file);
        return createAttachment(file.name, file.type, dataUrl);
      }),
    );

    setDraft((current) => ({
      ...current,
      attachments: [...current.attachments, ...attachments],
    }));
    setImageError(files.length > remain ? "3장까지만 추가되어 나머지는 제외되었습니다." : null);
  }

  function removeAttachment(id: string) {
    setDraft((current) => ({
      ...current,
      attachments: current.attachments.filter((attachment) => attachment.id !== id),
    }));
    setImageError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit(draft);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExportImage() {
    setIsExporting(true);
    try {
      const dataUrl = await createCardImage(draft);
      const file = dataUrlToFile(dataUrl, `reading-card-${Date.now()}.png`);

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: draft.book_title || "독서카드",
          text: "독서카드를 이미지로 저장합니다.",
          files: [file],
        });
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = file.name;
      anchor.click();
    } finally {
      setIsExporting(false);
    }
  }

  function preventEnterSubmit(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }

  function normalizeKeywordValue(raw: string) {
    return raw
      .split(/[,\s]+/)
      .map((item) => item.trim().replace(/^#+/, ""))
      .filter(Boolean)
      .map((item) => `#${item}`)
      .join(" ");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-0 overflow-hidden rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
      style={{ backgroundColor: theme.background, border: `1px solid ${theme.border}` }}
    >
      <div className="border-b px-4 py-3" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <h3 className="text-base font-semibold" style={{ color: theme.text }}>
          <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: theme.muted }}>
            New Card
          </span>
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: theme.border }}>
        <RowField
          label="책 제목"
          borderColor={theme.border}
          textColor={labelColor}
          action={
            onDelete ? (
              <button
                type="button"
                onClick={() => {
                  void onDelete();
                }}
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.muted }}
              >
                삭제
              </button>
            ) : null
          }
        >
          <AutoResizeTextarea
            value={draft.book_title}
            onChange={(event) => updateField("book_title", event.target.value)}
            placeholder="프레임: 나를 바꾸는 실천학의 지혜"
            className={lineTextareaClassName}
            minRows={1}
            style={editorInputStyle(inputColor)}
          />
        </RowField>

        <RowField label="핵심 질문" multiline borderColor={theme.border} textColor={labelColor}>
          <AutoResizeTextarea
            value={draft.question}
            onChange={(event) => updateField("question", event.target.value)}
            placeholder="어떻게 이 책의 질문을 내 삶에 연결할 수 있을까?"
            className={lineTextareaClassName}
            minRows={1}
            style={editorInputStyle(inputColor)}
          />
        </RowField>

        <RowField label="키워드" multiline borderColor={theme.border} textColor={labelColor}>
          <input
            value={draft.keywords}
            onChange={(event) => updateField("keywords", event.target.value)}
            onBlur={(event) => updateField("keywords", normalizeKeywordValue(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                updateField("keywords", normalizeKeywordValue(draft.keywords));
                return;
              }

              if (event.key === " " || event.key === "," || event.key === "Tab") {
                event.preventDefault();
                const normalized = normalizeKeywordValue(draft.keywords);
                updateField("keywords", normalized ? `${normalized} ` : "");
              }
            }}
            placeholder="#선택적 주의, #프레이밍 효과"
            className={lineInputClassName}
            style={editorInputStyle(inputColor)}
          />
        </RowField>

        <RowField label="한 줄 요약" multiline borderColor={theme.border} textColor={labelColor}>
          <AutoResizeTextarea
            value={draft.summary}
            onChange={(event) => updateField("summary", event.target.value)}
            placeholder="프레임은 현실을 바꾸지 않지만 현실을 경험하는 방식을 바꾼다."
            className={lineTextareaClassName}
            minRows={1}
            style={editorInputStyle(inputColor)}
          />
        </RowField>

        <RowField label="메모" multiline borderColor={theme.border} textColor={labelColor}>
          <AutoResizeTextarea
            value={draft.memo}
            onChange={(event) => updateField("memo", event.target.value)}
            placeholder="인상 깊은 문장이나 장면을 짧게 적어 주세요."
            className={lineTextareaClassName}
            minRows={1}
            style={editorInputStyle(inputColor)}
          />
        </RowField>

        <RowField
          label="도서 구매"
          borderColor={theme.border}
          textColor={labelColor}
          action={
            draft.purchase_link.trim() ? (
              <button
                type="button"
                onClick={() => {
                  void handleVerifyLink();
                }}
                className="inline-flex h-9 min-w-9 items-center justify-center text-xl font-bold leading-none"
                style={{ color: isLinkVerified ? "#16a34a" : isCheckingLink ? "#b45309" : theme.muted }}
                aria-label="구매 링크 확인"
                title="구매 링크 확인"
              >
                {isLinkVerified ? "V" : isCheckingLink ? "…" : "-"}
              </button>
            ) : null
          }
        >
          <input
            value={draft.purchase_link}
            onChange={(event) => {
              updateField("purchase_link", event.target.value);
              setIsLinkVerified(false);
            }}
            onKeyDown={preventEnterSubmit}
            placeholder="도서 구매 링크 입력"
            className={lineInputClassName}
            style={editorInputStyle(inputColor)}
          />
        </RowField>

        <RowField label="읽음 상태" borderColor={theme.border} textColor={labelColor}>
          <select
            value={draft.read_status}
            onChange={(event) => updateField("read_status", event.target.value as CardDraft["read_status"])}
            className={lineSelectClassName}
            style={editorInputStyle(inputColor)}
            disabled={offlineMode}
          >
            {offlineMode ? (
              <option value="offline">오프라인</option>
            ) : (
              <>
                <option value="unread">미독</option>
                <option value="reading">읽는 중</option>
                <option value="read">완독</option>
              </>
            )}
          </select>
        </RowField>

        <RowField label="공개 범위" borderColor={theme.border} textColor={labelColor}>
          <select
            value={draft.visibility}
            onChange={(event) => updateField("visibility", event.target.value as CardDraft["visibility"])}
            className={lineSelectClassName}
            style={editorInputStyle(inputColor)}
          >
            <option value="alone">나만 보기</option>
            <option value="friend" disabled>
              친구 공유 (다음 단계)
            </option>
            <option value="public" disabled>
              전체 공개 (다음 단계)
            </option>
          </select>
        </RowField>

        <RowField label="이미지첨부" borderColor={theme.border} textColor={labelColor}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <label
                className="inline-flex h-10 cursor-pointer items-center rounded-full px-4 text-sm font-semibold"
                style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.text }}
              >
                +
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    void handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
              <label
                className="inline-flex h-10 cursor-pointer items-center rounded-full px-4 text-sm font-semibold"
                style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface, color: theme.text }}
              >
                카메라
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => {
                    void handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                  className="hidden"
                />
              </label>
              <span
                className="inline-flex h-9 items-center rounded-full px-3 text-xs font-medium"
                style={{ backgroundColor: theme.surface, color: theme.muted }}
              >
                {draft.attachments.length}/3장
              </span>
            </div>

            {imageError ? <p className="text-xs text-red-700">{imageError}</p> : null}

            {draft.attachments.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {draft.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative overflow-hidden rounded-2xl"
                    style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.surface }}
                  >
                    <img
                      src={attachment.dataUrl}
                      alt={attachment.name}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-semibold text-white"
                      aria-label="이미지 삭제"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: labelColor }}>
                사진이나 메모 이미지를 최대 3장까지 넣을 수 있습니다.
              </p>
            )}
          </div>
        </RowField>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-3" style={{ backgroundColor: theme.surface }}>
        <button
          type="button"
          onClick={() => {
            void handleExportImage();
          }}
          disabled={isExporting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold disabled:opacity-60"
          style={{ border: `1px solid ${theme.border}`, backgroundColor: "rgba(255,255,255,0.7)", color: theme.text }}
        >
          <span aria-hidden="true">🖼</span>
          {isExporting ? "이미지 준비 중" : "이미지 저장"}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <span aria-hidden="true">💾</span>
          {isSaving ? "저장 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function AutoResizeTextarea({
  minRows = 1,
  className,
  value,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value"> & {
  value: string;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  function resize() {
    const element = ref.current;
    if (!element) {
      return;
    }

    element.style.height = "0px";
    const nextHeight = Math.max(element.scrollHeight, minRows * 24);
    element.style.height = `${nextHeight}px`;
  }

  useEffect(() => {
    resize();
  }, [value, minRows]);

  return <textarea ref={ref} value={value} className={className} rows={minRows} onInput={resize} {...props} />;
}

function RowField({
  label,
  children,
  multiline = false,
  action,
  borderColor,
  textColor,
}: PropsWithChildren<{ label: string; multiline?: boolean; action?: ReactNode; borderColor: string; textColor: string }>) {
  return (
    <label className="grid grid-cols-[96px_minmax(0,1fr)] gap-0 md:grid-cols-[110px_minmax(0,1fr)]">
      <span
        className={`px-4 text-[14px] font-bold ${multiline ? "py-2.5 align-top" : "py-2.5"}`}
        style={{ borderRight: `1px solid ${borderColor}`, color: textColor }}
      >
        {label}
      </span>
      <div className="px-4 py-2">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">{children}</div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </label>
  );
}

const lineInputClassName =
  "h-9 w-full border-0 bg-transparent px-0 text-[14px] leading-6 outline-none placeholder:text-[14px] placeholder:text-stone-400";

const lineTextareaClassName =
  "w-full overflow-hidden resize-none border-0 bg-transparent px-0 py-0 text-[14px] leading-6 outline-none placeholder:text-[14px] placeholder:text-stone-400";

const lineSelectClassName =
  "h-9 w-full border-0 bg-transparent px-0 text-[14px] outline-none";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [header, content] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(content);
  const array = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    array[index] = binary.charCodeAt(index);
  }

  return new File([array], filename, { type: mime });
}

async function verifyLink(link: string) {
  try {
    new URL(link);
  } catch {
    return false;
  }

  try {
    await fetch(link, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
    });
    return true;
  } catch {
    return false;
  }
}

async function createCardImage(draft: CardDraft) {
  const theme = getCardTheme(draft.color_theme);
  const width = 1080;
  const leftLabel = 180;
  const paddingX = 64;
  const rowHeight = 84;
  const longRows = [
    { label: "책 제목", value: draft.book_title || "-" },
    { label: "핵심 질문", value: draft.question || "-" },
    { label: "키워드", value: draft.keywords || "-" },
    { label: "한 줄 요약", value: draft.summary || "-" },
    { label: "메모", value: draft.memo || "-" },
    { label: "도서 구매", value: draft.purchase_link || "-" },
    { label: "읽음 상태", value: draft.read_status },
    { label: "공개 범위", value: draft.visibility },
  ];

  const prepared = longRows.map((row) => ({
    ...row,
    lines: wrapText(row.value, 34),
  }));

  const imageBlockHeight = draft.attachments.length > 0 ? 280 : 0;
  const contentHeight =
    120 +
    prepared.reduce((total, row) => total + Math.max(rowHeight, 34 + row.lines.length * 42), 0) +
    imageBlockHeight +
    80;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = contentHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("이미지 컨텍스트를 만들 수 없습니다.");
  }

  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, contentHeight);

  context.fillStyle = theme.text;
  context.font = '700 32px "BookCardSans", sans-serif';
  context.fillText("나의 독서 카드", paddingX, 58);
  context.font = '600 18px "BookCardSans", sans-serif';
  context.fillStyle = theme.muted;
  context.fillText(new Date().toLocaleString("ko-KR"), paddingX, 92);

  let top = 120;
  context.strokeStyle = theme.border;
  context.lineWidth = 2;

  for (const row of prepared) {
    const blockHeight = Math.max(rowHeight, 34 + row.lines.length * 42);
    context.beginPath();
    context.moveTo(0, top);
    context.lineTo(width, top);
    context.stroke();

    context.beginPath();
    context.moveTo(leftLabel + paddingX, top);
    context.lineTo(leftLabel + paddingX, top + blockHeight);
    context.stroke();

    context.font = '400 26px "BookCardSans", sans-serif';
    context.fillStyle = theme.text;
    context.fillText(row.label, paddingX, top + 42);

    context.font = '400 30px "BookCardSans", sans-serif';
    context.fillStyle = theme.muted;
    row.lines.forEach((line, index) => {
      context.fillText(line, leftLabel + paddingX + 24, top + 42 + index * 40);
    });

    top += blockHeight;
  }

  context.beginPath();
  context.moveTo(0, top);
  context.lineTo(width, top);
  context.stroke();

  if (draft.attachments.length > 0) {
    top += 24;
    context.font = '400 26px "BookCardSans", sans-serif';
    context.fillStyle = theme.text;
    context.fillText("이미지", paddingX, top + 24);

    const images = await Promise.all(
      draft.attachments.slice(0, 3).map((attachment) => loadImage(attachment.dataUrl)),
    );

    images.forEach((image, index) => {
      const x = paddingX + index * 180;
      const y = top + 40;
      context.drawImage(image, x, y, 160, 160);
    });
  }

  return canvas.toDataURL("image/png");
}

function wrapText(value: string, maxChars: number) {
  const normalized = value.replace(/\n/g, " ");
  const lines: string[] = [];

  for (let start = 0; start < normalized.length; start += maxChars) {
    lines.push(normalized.slice(start, start + maxChars));
  }

  return lines.length > 0 ? lines : ["-"];
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    image.src = src;
  });
}

function editorInputStyle(color: string) {
  return {
    color,
    fontSize: "14px",
    lineHeight: "1.7",
    fontWeight: 700,
    fontFamily: '"BookCardSans", sans-serif',
  };
}
