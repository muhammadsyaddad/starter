/*
 * tRPC server toolbox: context, router factory, procedures.
 * Runs inside Next (app/api/trpc/[trpc]/route.ts); procedures call the Go backend.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

/** Built once per request; every procedure gets it as `ctx`. */
export async function createTRPCContext({ req }: { req: Request }) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  return { token };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/** Requires a Bearer token; narrows `ctx.token` to string. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.token) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { token: ctx.token } });
});
