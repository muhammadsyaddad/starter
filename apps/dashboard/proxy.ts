import { NextResponse, type NextRequest } from "next/server";

/** Optimistic guard: no token cookie -> /login. Real checks happen in the backend. */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Backend CORS 403s POSTs whose Origin isn't allow-listed (e.g. :3001); the hop is server-side, so drop it.
  if (pathname.startsWith("/be-api/") || pathname.startsWith("/tel-api/")) {
    const headers = new Headers(req.headers);
    headers.delete("origin");
    return NextResponse.next({ request: { headers } });
  }
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" || req.cookies.has("auth_token")) return;
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!login|api|_next|favicon.ico|.*\\..*).*)"],
};
