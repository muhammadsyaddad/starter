import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { list, read, renderPdf, write, type Kind } from "@/app/documentation/actions";
import { activity, command, type Command } from "@/lib/agent-bus";
import { DATA_DIR } from "@/lib/data-dir";

const txt = (text: string) => ({ content: [{ type: "text" as const, text }] });
const kind = z.enum(["docs", "templates"]).describe("docs = Tiptap HTML, templates = pandoc LaTeX templates");
const name = z.string().regex(/^[\w-]+$/);
const target = z.string().describe("data-agent id from ui_snapshot");

/** Run a UI command; errors (no window, timeout, missing target) go back to the agent as text. */
const ui = async (cmd: Command) => {
  try {
    return txt(JSON.stringify(await command(cmd), null, 2));
  } catch (e) {
    return txt(`ERROR: ${(e as Error).message}`);
  }
};

const handler = createMcpHandler((server) => {
  server.registerTool("list", { description: "List doc or template names", inputSchema: { kind } }, async (a) =>
    txt((await list(a.kind as Kind)).join("\n")),
  );
  server.registerTool("read", { description: "Read a doc (HTML) or template (LaTeX)", inputSchema: { kind, name } }, async (a) =>
    txt(await read(a.kind as Kind, a.name)),
  );
  server.registerTool(
    "write",
    { description: "Create/overwrite a doc (HTML) or pandoc template (LaTeX)", inputSchema: { kind, name, content: z.string() } },
    async (a) => {
      activity({ tool: "write", phase: "start", kind: a.kind, name: a.name });
      await write(a.kind as Kind, a.name, a.content);
      activity({ tool: "write", phase: "done", kind: a.kind, name: a.name, content: a.content });
      return txt("saved");
    },
  );
  server.registerTool(
    "render_pdf",
    {
      description: "Compile a doc to PDF with pandoc. Returns output path or pandoc/LaTeX error.",
      inputSchema: { doc: name, template: name.optional(), title: z.string().optional() },
    },
    async (a) => {
      activity({ tool: "render_pdf", phase: "start", kind: "docs", name: a.doc });
      const res = await renderPdf(await read("docs", a.doc), a.title, a.template && (await read("templates", a.template)));
      if (!res.pdf) {
        activity({ tool: "render_pdf", phase: "error", kind: "docs", name: a.doc, error: res.error });
        return txt(`ERROR:\n${res.error}`);
      }
      activity({ tool: "render_pdf", phase: "done", kind: "docs", name: a.doc, pdf: res.pdf });
      const out = join(DATA_DIR, "out", `${a.doc}.pdf`);
      await mkdir(join(out, ".."), { recursive: true });
      await writeFile(out, Buffer.from(res.pdf, "base64"));
      return txt(out);
    },
  );

  // UI bridge: drives the user's open dashboard window so they can watch. Always ui_snapshot before acting.
  server.registerTool(
    "ui_navigate",
    { description: "Navigate the open dashboard window to a route, e.g. /documentation/generate", inputSchema: { path: z.string().startsWith("/") } },
    async (a) => ui({ op: "navigate", path: a.path }),
  );
  server.registerTool(
    "ui_snapshot",
    { description: "Current route, title and every actionable [data-agent] element (id, tag, label, value, disabled). Call before ui_click/ui_fill.", inputSchema: {} },
    async () => ui({ op: "snapshot" }),
  );
  server.registerTool(
    "ui_click",
    { description: "Click a [data-agent] element in the open window", inputSchema: { target } },
    async (a) => ui({ op: "click", target: a.target }),
  );
  server.registerTool(
    "ui_fill",
    { description: "Type a value into a [data-agent] input/textarea in the open window", inputSchema: { target, value: z.string() } },
    async (a) => ui({ op: "fill", target: a.target, value: a.value }),
  );
});

export { handler as GET, handler as POST };
