"use client";

import type * as React from "react";
import { SessionProvider } from "next-auth/react";

import { ProfilesProvider } from "@/components/providers/profiles-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ProfilesProvider>{children}</ProfilesProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
