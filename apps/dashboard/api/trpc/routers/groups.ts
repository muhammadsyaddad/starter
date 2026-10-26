/*
 * Example router. Client usage:
 *   const trpc = useTRPC();
 *   const { data } = useQuery(trpc.groups.list.queryOptions({ page: 1 }));
 */

import { z } from "zod";
import { go } from "../go";
import { createTRPCRouter, protectedProcedure } from "../init";

export type Group = {
  id: string;
  name: string;
  alias: string;
  city: string;
  telp: string;
  company_count: number;
  created_at: string;
  updated_at: string;
};

export const groupsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).optional(),
          limit: z.number().int().min(1).max(100).optional(),
        })
        .optional(),
    )
    .query(({ input, ctx }) =>
      go<Group[]>("client/groups", ctx.token, { params: input }),
    ),
});
