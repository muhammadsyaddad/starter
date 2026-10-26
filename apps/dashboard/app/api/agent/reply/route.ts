import { reply } from "@/lib/agent-bus";

export async function POST(req: Request) {
  const { id, result, error } = (await req.json()) as { id: string; result?: unknown; error?: string };
  reply(id, result, error);
  return new Response(null, { status: 204 });
}
