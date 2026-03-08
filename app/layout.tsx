import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Prata } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { AppProviders } from "@/app/providers";

import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Prata({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Личный профиль",
  description:
    "Local-first веб-продукт для самопонимания: Big Five, межличностный стиль, конфликтный профиль, полный экспорт и ручное сравнение двух людей.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} antialiased`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
