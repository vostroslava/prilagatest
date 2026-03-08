import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Outfit } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { AppProviders } from "@/app/providers";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

const displayFont = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Личный профиль",
  description: "Local-first веб-продукт для самопонимания без автоматических вердиктов.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning className="dark">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} antialiased`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
