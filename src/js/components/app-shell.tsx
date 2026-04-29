"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";

import { CARD_THEMES } from "@/lib/card-themes";
import { getStoredCardTheme, setStoredCardTheme } from "@/lib/card-theme-client";
import { CardThemeId } from "@/lib/types";
import { APP_NAME } from "@/lib/utils";

const DEMO_AUTH_KEY = "bookcard-demo-auth";
const DEMO_AUTH_ACCOUNTS_KEY = "bookcard-demo-accounts";

type AuthUser = { name: string; nickname: string; email: string };
type StoredAccount = AuthUser & { password: string };
type AuthMode = "login" | "signup" | "findNickname" | "resetPassword";

export function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>("butter");
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const isEditorPage = pathname === "/cards/new" || pathname.endsWith("/edit");
  const canOpenMenu = !isEditorPage;
  const isOnlinePage = pathname === "/";
  const isOfflinePage = pathname === "/offline";
  const isMembersPage = pathname === "/members";
  const isMinePage = pathname === "/mine";
  const headerTitle = isOfflinePage ? "오프라인 독서카드" : APP_NAME;

  useEffect(() => {
    setSelectedTheme(getStoredCardTheme());
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(DEMO_AUTH_KEY);
      if (stored) {
        try {
          setAuthUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsPaletteOpen(false);
    if (typeof window !== "undefined") {
      setReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
    }
  }, [pathname]);

  function updateAuthField(key: keyof typeof authForm, value: string) {
    setAuthForm((current) => ({ ...current, [key]: value }));
  }

  function getStoredAccounts(): StoredAccount[] {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(DEMO_AUTH_ACCOUNTS_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as StoredAccount[];
    } catch {
      return [];
    }
  }

  function saveStoredAccounts(accounts: StoredAccount[]) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  }

  function handleAuthToggle() {
    if (authUser) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DEMO_AUTH_KEY);
      }
      setAuthUser(null);
      setAuthMessage(null);
      setIsMenuOpen(false);
      return;
    }

    setAuthMessage(null);
    setAuthMode("login");
    setIsAuthModalOpen(true);
  }

  function handleAuthSubmit() {
    const accounts = getStoredAccounts();

    if (authMode === "login") {
      const matched = accounts.find(
        (account) =>
          account.nickname === authForm.nickname.trim() && account.password === authForm.password,
      );

      if (!matched) {
        setAuthMessage("별명 또는 비밀번호가 맞지 않습니다.");
        return;
      }

      const nextUser = { name: matched.name, nickname: matched.nickname, email: matched.email };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(nextUser));
      }
      setAuthUser(nextUser);
      setIsAuthModalOpen(false);
      setIsMenuOpen(false);
      setAuthMessage(null);
      setAuthForm({
        name: "",
        nickname: "",
        email: "",
        password: "",
        passwordConfirm: "",
      });
      return;
    }

    if (authMode === "signup") {
      if (!authForm.name || !authForm.nickname || !authForm.email || !authForm.password || !authForm.passwordConfirm) {
        setAuthMessage("모든 항목을 입력해 주세요.");
        return;
      }

      if (authForm.password !== authForm.passwordConfirm) {
        setAuthMessage("비밀번호가 일치하지 않습니다.");
        return;
      }

      if (accounts.some((account) => account.nickname === authForm.nickname.trim())) {
        setAuthMessage("이미 사용 중인 별명입니다.");
        return;
      }

      const nextAccount: StoredAccount = {
        name: authForm.name.trim(),
        nickname: authForm.nickname.trim(),
        email: authForm.email.trim(),
        password: authForm.password,
      };

      saveStoredAccounts([...accounts, nextAccount]);
      setAuthMessage("회원가입이 완료되었습니다. 이제 로그인할 수 있습니다.");
      setAuthMode("login");
      setAuthForm((current) => ({
        ...current,
        name: "",
        email: "",
        passwordConfirm: "",
      }));
      return;
    }

    if (authMode === "findNickname") {
      const matched = accounts.find((account) => account.email === authForm.email.trim());
      setAuthMessage(
        matched
          ? `현재 로컬 데모에서는 이메일 전송 대신 바로 안내합니다. 별명은 ${matched.nickname} 입니다.`
          : "일치하는 email 계정을 찾지 못했습니다.",
      );
      return;
    }

    if (authMode === "resetPassword") {
      if (!authForm.nickname || !authForm.email) {
        setAuthMessage("별명과 email을 모두 입력해 주세요.");
        return;
      }

      const matched = accounts.find(
        (account) =>
          account.nickname === authForm.nickname.trim() &&
          account.email === authForm.email.trim(),
      );

      if (!matched) {
        setAuthMessage("별명과 email이 일치하는 계정을 찾지 못했습니다.");
        return;
      }

      setAuthMessage("현재 로컬 데모에서는 실제 email 전송 대신 안내만 표시합니다. 실제 구현 시 email로 링크를 보내고, 메일에서 새 비밀번호를 설정하게 됩니다.");
      setAuthForm((current) => ({
        ...current,
        password: "",
        passwordConfirm: "",
      }));
    }
  }

  const menuItems = isOnlinePage
    ? [
        { href: "/offline", label: "오프라인" },
        { href: "/members", label: "멤버관리" },
      ]
    : isOfflinePage
      ? [
          { href: "/", label: "온라인" },
          { href: "/members", label: "멤버관리" },
        ]
      : [
          { href: "/", label: "온라인" },
          { href: "/offline", label: "오프라인" },
          { href: "/members", label: "멤버관리" },
        ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-background/95 px-5 pb-4 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur relative">
        <div className="relative flex items-center justify-between gap-3">
          <Link
            href="#"
            onClick={(event) => {
              event.preventDefault();

              if (isEditorPage) {
                router.push(returnTo === "offline" ? "/offline" : "/");
                return;
              }

              if (canOpenMenu) {
                setIsMenuOpen((current) => !current);
              }
            }}
            className="inline-flex h-11 w-11 items-center justify-center text-[1.5rem] text-ink"
            aria-label={isEditorPage ? "뒤로가기" : "메뉴 열기"}
          >
            {isEditorPage ? "←" : "≡"}
          </Link>

          <button
            type="button"
            onClick={() => {
              if (!isEditorPage) {
                router.push("/");
              }
            }}
            className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            aria-label="온라인 홈으로 이동"
          >
            <h1 className="text-2xl font-semibold tracking-tight">{headerTitle}</h1>
          </button>

          <div className="flex items-center gap-2">
            {isEditorPage ? (
              <button
                type="button"
                onClick={() => setIsPaletteOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center"
                aria-label="카드 색상 선택"
              >
                <span className="h-11 w-11 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#ff8eb5_0deg,#ffdd77_60deg,#9de27d_120deg,#6bdff2_180deg,#7f9cff_240deg,#ca93ff_300deg,#ff8eb5_360deg)] shadow-[0_4px_12px_rgba(0,0,0,0.12)]" />
              </button>
            ) : null}
            {!isEditorPage ? (
              <Link
                href={pathname === "/offline" ? "/cards/new?returnTo=offline" : "/cards/new"}
                className="inline-flex h-7 items-center rounded-full border border-[#d6c36b] bg-[#f3e59a] px-2.5 text-sm font-semibold text-[#2b2200]"
              >
                + 카드
              </Link>
            ) : null}
          </div>
        </div>

        {isPaletteOpen ? (
          <div className="absolute left-8 right-8 top-[calc(100%-0.35rem)] z-40 rounded-[1rem] border border-line bg-surface p-3 shadow-[0_22px_44px_rgba(0,0,0,0.38)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Card Color</p>
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {CARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setSelectedTheme(theme.id);
                    setStoredCardTheme(theme.id);
                    setIsPaletteOpen(false);
                  }}
                  className={`h-7 rounded-full border ${selectedTheme === theme.id ? "border-stone-950" : "border-transparent"}`}
                  style={{ backgroundColor: theme.background }}
                  aria-label={theme.name}
                  title={theme.name}
                />
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <div
        className={`fixed inset-0 z-20 bg-black/45 transition-opacity duration-300 ${
          isMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-[13.5rem] max-w-[72vw] border-r border-line bg-surface px-5 pb-8 pt-[max(env(safe-area-inset-top),1.25rem)] shadow-[18px_0_40px_rgba(0,0,0,0.42)] transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-[110%]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Menu</span>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center text-xl text-muted"
            aria-label="메뉴 닫기"
          >
            ×
          </button>
        </div>
        <div className="mt-8 space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">내 독서카드</p>
            <Link
              href="/mine"
              onClick={() => setIsMenuOpen(false)}
              className={`block text-[18px] font-medium ${isMinePage ? "text-[#f3e59a]" : "text-ink"}`}
            >
              내 독서카드
            </Link>
          </div>
          <div className="border-t border-dashed border-line" />
          {menuItems.map((item) => {
            const active =
              (item.href === "/" && isOnlinePage) ||
              (item.href === "/offline" && isOfflinePage) ||
              (item.href === "/members" && isMembersPage);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block text-[18px] font-medium ${active ? "text-[#f3e59a]" : "text-ink"}`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="my-8 border-t border-dashed border-line" />
          <button
            type="button"
            onClick={handleAuthToggle}
            className="block text-left text-[18px] font-medium text-ink"
          >
            {authUser ? "로그오프" : "로그인"}
          </button>
        </div>
      </aside>

      {isAuthModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-5">
          <div className="w-full max-w-md rounded-[1.5rem] border border-line bg-surface p-4 shadow-[0_24px_48px_rgba(0,0,0,0.38)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">
                {authMode === "login"
                  ? "로그인"
                  : authMode === "signup"
                    ? "회원 가입"
                    : authMode === "findNickname"
                      ? "별명 찾기"
                      : "비밀번호 찾기"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center text-xl text-muted"
                aria-label="회원가입 창 닫기"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {authMode === "login" ? (
                <div className="grid grid-cols-[28px_minmax(0,1fr)_52px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
                  <span className="text-sm text-muted">별명</span>
                  <input
                    value={authForm.nickname}
                    onChange={(event) => updateAuthField("nickname", event.target.value)}
                    className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                  />
                  <span className="text-sm text-muted">비밀번호</span>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) => updateAuthField("password", event.target.value)}
                    className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                  />
                </div>
              ) : null}

              {authMode === "signup" ? (
                <>
                  <div className="grid grid-cols-[28px_minmax(0,1fr)_28px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
                    <span className="text-sm text-muted">이름</span>
                    <input
                      value={authForm.name}
                      onChange={(event) => updateAuthField("name", event.target.value)}
                      className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                    />
                    <span className="text-sm text-muted">별명</span>
                    <input
                      value={authForm.nickname}
                      onChange={(event) => updateAuthField("nickname", event.target.value)}
                      className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
                    <span className="text-sm text-muted">email</span>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) => updateAuthField("email", event.target.value)}
                      className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-[52px_minmax(0,1fr)_76px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
                    <span className="text-sm text-muted">비밀번호</span>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) => updateAuthField("password", event.target.value)}
                      className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                    />
                    <span className="text-sm text-muted">비밀번호확인</span>
                    <input
                      type="password"
                      value={authForm.passwordConfirm}
                      onChange={(event) => updateAuthField("passwordConfirm", event.target.value)}
                      className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                    />
                  </div>
                </>
              ) : null}

              {authMode === "findNickname" ? (
                <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
                  <span className="text-sm text-muted">email</span>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => updateAuthField("email", event.target.value)}
                    className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                  />
                </div>
              ) : null}

              {authMode === "resetPassword" ? (
                <>
                  <div className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
                    <span className="text-sm text-muted">별명</span>
                    <input
                      value={authForm.nickname}
                      onChange={(event) => updateAuthField("nickname", event.target.value)}
                      className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
                    <span className="text-sm text-muted">email</span>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(event) => updateAuthField("email", event.target.value)}
                      className="h-7 rounded-lg border border-line bg-background px-2 text-sm text-ink outline-none"
                    />
                  </div>
                </>
              ) : null}
            </div>

            {authMessage ? <p className="mt-3 text-sm text-red-400">{authMessage}</p> : null}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="mx-auto inline-flex h-7 w-[100px] items-center justify-center rounded-2xl border border-line text-sm font-semibold text-ink"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAuthSubmit}
                className="mx-auto inline-flex h-7 w-[100px] items-center justify-center rounded-2xl bg-ink text-sm font-semibold text-background"
              >
                {authMode === "login"
                  ? "로그인"
                  : authMode === "signup"
                    ? "회원가입"
                    : authMode === "findNickname"
                      ? "별명찾기"
                      : "비밀번호찾기"}
              </button>
            </div>
            {!authUser ? (
              <div className="mt-3 flex items-center justify-between text-[13px]">
                <button type="button" onClick={() => { setAuthMode("signup"); setAuthMessage(null); }} className="text-[13px] text-muted">
                  회원 가입
                </button>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { setAuthMode("findNickname"); setAuthMessage(null); }} className="text-[13px] text-muted">
                    별명찾기
                  </button>
                  <button type="button" onClick={() => { setAuthMode("resetPassword"); setAuthMessage(null); }} className="text-[13px] text-muted">
                    비밀번호 찾기
                  </button>
                </div>
              </div>
            ) : null}
            {authMode === "login" ? (
              <p className="mt-2 text-center text-[13px] text-muted">별명이 회원 ID 입니다.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <main className="flex-1 px-4 pb-10 pt-0">{children}</main>
    </div>
  );
}
