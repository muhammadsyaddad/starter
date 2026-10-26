"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      // Server runs the no-flash script; on the client mark it inert so React
      // 19 stops warning about <script> inside a component.
      scriptProps={
        typeof window === "undefined" ? undefined : { type: "text/plain" }
      }
    >
      {children}
    </NextThemesProvider>
  );
}
