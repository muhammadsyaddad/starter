"use client";

import { Badge } from "@repo/ui/ui/badge";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";

/** Mirrors `Activity` / `AgentEvent` in lib/agent-bus.ts (server-only module). */
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
type CommandEvent = { type: "command"; id: string } & (
  | { op: "navigate"; path: string }
  | { op: "snapshot" }
  | { op: "click"; target: string }
  | { op: "fill"; target: string; value: string }
);

type Listener = (a: Activity) => void;
const AgentContext = createContext<Set<Listener>>(new Set());

/** Subscribe a page to agent activity (MCP write / render_pdf, ...). */
export function useAgentActivity(fn: Listener) {
  const listeners = useContext(AgentContext);
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const l: Listener = (a) => ref.current(a);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, [listeners]);
}

/**
 * Reveal `full` progressively through `set` over ~`ms`. With `html`, never cuts inside a tag or entity.
 * Returns a cancel function.
 */
export function typeOut(full: string, set: (s: string) => void, { ms = 1500, html = false } = {}) {
  let i = 0;
  let raf = 0;
  const step = Math.max(1, Math.ceil(full.length / (ms / 16)));
  const tick = () => {
    i = Math.min(full.length, i + step);
    if (html) {
      const lt = full.lastIndexOf("<", i - 1);
      if (lt > full.lastIndexOf(">", i - 1)) i = full.indexOf(">", lt) + 1 || full.length;
      const entity = /&[#\w]{0,8}$/.exec(full.slice(0, i))?.[0];
      if (entity) i += /^[#\w]{0,8};/.exec(full.slice(i))?.[0].length ?? 0;
    }
    set(full.slice(0, i));
    if (i < full.length) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const find = (target: string) => {
  const el = document.querySelector<HTMLElement>(`[data-agent="${CSS.escape(target)}"]`);
  if (!el) throw new Error(`No element [data-agent="${target}"] on ${location.pathname}. Call ui_snapshot.`);
  return el;
};
const visible = (el: HTMLElement) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

/** React tracks input values itself; set through the native setter so onChange fires. */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function snapshot() {
  const els = [...document.querySelectorAll<HTMLElement>("[data-agent]")].filter(visible);
  return {
    route: location.pathname + location.search,
    title: document.querySelector("h1")?.textContent ?? document.title,
    elements: els.map((el) => {
      const field = el as HTMLInputElement;
      return {
        id: el.dataset.agent,
        tag: el.isContentEditable ? "contenteditable" : el.tagName.toLowerCase(),
        label: (el.getAttribute("aria-label") || field.placeholder || el.textContent || "").trim().slice(0, 80),
        value: el.matches("input, textarea, select")
          ? field.value.slice(0, 200)
          : el.isContentEditable
            ? el.innerText.slice(0, 200)
            : undefined,
        disabled: field.disabled || el.getAttribute("aria-disabled") === "true" || undefined,
      };
    }),
  };
}

const label = (a: Activity) =>
  a.phase === "error"
    ? `${a.tool} failed`
    : `${{ write: "Writing", render_pdf: "Compiling PDF" }[a.tool] ?? a.tool} ${a.name ?? ""}${a.phase === "done" ? " ✓" : "…"}`;

export function AgentBridge({ children }: { children: React.ReactNode }) {
  const [listeners] = useState(() => new Set<Listener>());
  const [status, setStatus] = useState<{ text: string; tone: "busy" | "done" | "error" } | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; click: number } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const path = useRef(pathname);
  path.current = pathname;
  const hide = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = (text: string, tone: "busy" | "done" | "error") => {
    clearTimeout(hide.current);
    setStatus({ text, tone });
    if (tone !== "busy") hide.current = setTimeout(() => (setStatus(null), setCursor(null)), 3000);
  };

  // Glide the fake cursor to an element, then pulse it.
  const pointAt = async (el: HTMLElement) => {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    await sleep(250);
    const r = el.getBoundingClientRect();
    setCursor((c) => ({ x: r.left + Math.min(r.width / 2, 40), y: r.top + r.height / 2, click: c?.click ?? 0 }));
    await sleep(550);
    setCursor((c) => c && { ...c, click: c.click + 1 });
  };

  const run = async (cmd: CommandEvent) => {
    switch (cmd.op) {
      case "navigate": {
        show(`Opening ${cmd.path}…`, "busy");
        router.push(cmd.path);
        for (let i = 0; i < 50 && path.current !== cmd.path.split("?")[0]; i++) await sleep(100);
        await sleep(300); // let the page mount
        show(`Opened ${path.current}`, "done");
        return { route: path.current };
      }
      case "snapshot":
        return snapshot();
      case "click": {
        const el = find(cmd.target);
        show(`Clicking ${cmd.target}…`, "busy");
        await pointAt(el);
        el.click();
        show(`Clicked ${cmd.target}`, "done");
        return { ok: true, route: location.pathname };
      }
      case "fill": {
        const el = find(cmd.target);
        show(`Typing into ${cmd.target}…`, "busy");
        await pointAt(el);
        el.focus();
        const delay = Math.min(30, 3000 / Math.max(1, cmd.value.length));
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          for (let i = 1; i <= cmd.value.length; i++) {
            setNativeValue(el, cmd.value.slice(0, i));
            await sleep(delay);
          }
          if (!cmd.value) setNativeValue(el, "");
        } else if (el.isContentEditable) {
          for (const ch of cmd.value) {
            document.execCommand("insertText", false, ch);
            await sleep(delay);
          }
        } else throw new Error(`[data-agent="${cmd.target}"] is not fillable`);
        show(`Filled ${cmd.target}`, "done");
        return { ok: true };
      }
    }
  };

  useEffect(() => {
    const es = new EventSource("/api/agent/events");
    es.onmessage = async (m) => {
      const e = JSON.parse(m.data) as Activity | CommandEvent;
      if (e.type === "activity") {
        show(label(e), e.phase === "start" ? "busy" : e.phase);
        listeners.forEach((l) => l(e));
        return;
      }
      let body: { id: string; result?: unknown; error?: string };
      try {
        body = { id: e.id, result: await run(e) };
      } catch (err) {
        show(`${e.op} failed`, "error");
        body = { id: e.id, error: (err as Error).message };
      }
      fetch("/api/agent/reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one stream per window; handlers read refs
  }, []);

  return (
    <AgentContext.Provider value={listeners}>
      {children}
      {cursor && (
        <div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[100] transition-transform duration-500 ease-out"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow">
            <path d="M2 2l6 16 2.5-6.5L17 9z" className="fill-primary stroke-background" strokeWidth="1.5" />
          </svg>
          <span key={cursor.click} className="absolute -left-2 -top-2 size-5 rounded-full bg-primary/40 animate-ping [animation-iteration-count:1]" />
        </div>
      )}
      {status && (
        <div className="fixed bottom-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-2">
          <Badge variant={status.tone === "error" ? "destructive" : status.tone === "done" ? "success" : "brand"} className="gap-2 px-3 py-1.5 text-sm shadow">
            {status.tone === "busy" && <span className="size-2 rounded-full bg-current animate-pulse" />}
            Agent · {status.text}
          </Badge>
        </div>
      )}
    </AgentContext.Provider>
  );
}
