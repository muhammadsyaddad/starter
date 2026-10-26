"use client";

import * as React from "react";
import { MOCK, logoutRedirect, request, tokens } from "@/lib/http";

/** RBAC bits per backend PAGE key. */
export const R = 1, W = 2, D = 4, X = 8;

type User = { id: string; username: string; email: string; fullName: string; role?: { id: string; name: string } };
type Access = { pages: Record<string, number>; components: Record<string, number> };
type Session = { user: User; access: Access };

const USER = "auth_user";

const Ctx = React.createContext<{
  user?: User;
  can: (perm: string | undefined, action: number) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}>({ can: () => true, login: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session>();

  React.useEffect(() => {
    if (MOCK || !tokens.get()) return;
    setSession(JSON.parse(localStorage.getItem(USER) ?? "null") ?? undefined);
    request<User>("auth/me").then(({ data, raw }) => {
      const s = { user: data, access: raw.access };
      localStorage.setItem(USER, JSON.stringify(s));
      setSession(s);
    }, () => {});
  }, []);

  const value = React.useMemo(
    () => ({
      user: session?.user,
      can: (perm: string | undefined, a: number) => {
        if (MOCK || !perm) return true;
        const p = session?.access?.pages ?? {};
        return ((p[perm] ?? p[perm.toLowerCase()] ?? 0) & a) === a;
      },
      login: async (email: string, password: string) => {
        const { data } = await request<{ accessToken: string; refreshToken: string; access: Access }>("auth/login", {
          method: "POST",
          body: { email, password },
        });
        tokens.set(data);
        const me = await request<User>("auth/me");
        const s = { user: me.data, access: data.access };
        localStorage.setItem(USER, JSON.stringify(s));
        setSession(s);
      },
      logout: logoutRedirect,
    }),
    [session],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => React.useContext(Ctx);
