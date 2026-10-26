/**
 * In-process bus between MCP tools and open dashboard windows.
 * Single Node process only (dev / desktop / one VPS instance); swap for Redis pub/sub if scaled out.
 */

export type Activity = {
  type: "activity";
  tool: string;
  phase: "start" | "done" | "error";
  kind?: string;
  name?: string;
  content?: string;
  pdf?: string;
  error?: string;
};

export type Command =
  | { op: "navigate"; path: string }
  | { op: "snapshot" }
  | { op: "click"; target: string }
  | { op: "fill"; target: string; value: string };

export type AgentEvent = Activity | ({ type: "command"; id: string } & Command);

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout };

// globalThis keeps one bus across HMR reloads and separately bundled route modules.
const g = globalThis as unknown as { agentBus?: { subs: Set<(e: AgentEvent) => void>; pending: Map<string, Pending> } };
const bus = (g.agentBus ??= { subs: new Set(), pending: new Map() });

export function subscribe(fn: (e: AgentEvent) => void) {
  bus.subs.add(fn);
  return () => void bus.subs.delete(fn);
}

const broadcast = (e: AgentEvent) => bus.subs.forEach((fn) => fn(e));

export const activity = (e: Omit<Activity, "type">) => broadcast({ type: "activity", ...e });

/** Send a command to the open window(s); resolves with the first reply. */
export function command(cmd: Command, timeoutMs = 15000) {
  if (!bus.subs.size) return Promise.reject(new Error("No dashboard window connected. Ask the user to open the app."));
  const id = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      bus.pending.delete(id);
      reject(new Error(`UI did not respond to ${cmd.op} within ${timeoutMs}ms`));
    }, timeoutMs);
    bus.pending.set(id, { resolve, reject, timer });
    broadcast({ type: "command", id, ...cmd });
  });
}

export function reply(id: string, result?: unknown, error?: string) {
  const p = bus.pending.get(id);
  if (!p) return; // already answered by another window, or timed out
  bus.pending.delete(id);
  clearTimeout(p.timer);
  if (error) p.reject(new Error(error));
  else p.resolve(result);
}
