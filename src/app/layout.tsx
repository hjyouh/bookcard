import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { APP_NAME } from "@/lib/utils";

import "../css/globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "오프라인 우선 독서카드 PWA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  icons: {
    apple: "/assets/icons/apple-touch-icon.svg",
    icon: [
      { url: "/assets/icons/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/assets/icons/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
