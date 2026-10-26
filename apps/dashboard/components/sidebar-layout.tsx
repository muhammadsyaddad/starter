"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SignOutIcon } from "@phosphor-icons/react";
import { AppSidebar } from "@repo/ui/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/ui/sidebar";
import { Button } from "@repo/ui/ui/button";
import { navigationData } from "@/lib/constant";
import { R, useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { PREFETCH } from "@/components/prefetch";
import { keyOf } from "@/lib/api";
import { MOCK } from "@/lib/http";

// 1. Buat Context agar page bisa tahu item mana yang aktif
export const SidebarContext = React.createContext<{
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}>({
  activeId: null,
  setActiveId: () => {},
});

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const { user, can, logout } = useAuth();
  const qc = useQueryClient();
  if (usePathname() === "/login") return children;

  // Hovering a link starts loading its page's table; 30s = no refetch on re-hover.
  const prefetch = (e: React.PointerEvent) => {
    if (MOCK) return;
    const href = (e.target as Element).closest("a")?.getAttribute("href");
    for (const a of PREFETCH[href ?? ""] ?? [])
      qc.prefetchQuery({ queryKey: keyOf(a), queryFn: a.list, staleTime: 30_000 });
  };

  const nav = navigationData
    .map((g) => ({ ...g, items: g.items.filter((i) => can(i.perm, R)) }))
    .filter((g) => g.items.length > 0);

  return (
    <SidebarContext.Provider value={{ activeId, setActiveId }}>
      <SidebarProvider className="h-dvh" onPointerOver={prefetch}>
        <AppSidebar
          activeId={activeId}
          onSelectNode={setActiveId}
          navigationData={nav}
        />

        <SidebarInset className="min-w-0">
          <header className="flex h-12 shrink-0 items-center justify-between px-3">
            <SidebarTrigger />
            <div className="flex items-center gap-1">
              {user && (
                <>
                  <span className="text-xs text-muted-foreground">
                    {user.fullName || user.username}
                  </span>
                  <Button variant="ghost" size="icon-sm" onClick={logout}>
                    <SignOutIcon />
                    <span className="sr-only">Logout</span>
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </SidebarContext.Provider>
  );
}
