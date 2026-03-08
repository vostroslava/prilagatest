"use client";

import type * as React from "react";

import { ProfilesProvider } from "@/components/providers/profiles-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProfilesProvider>{children}</ProfilesProvider>
    </ThemeProvider>
  );
}
