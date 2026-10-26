"use server";

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { DATA_DIR } from "@/lib/data-dir";

const run = promisify(execFile);
const ext = { docs: ".html", templates: ".tex" };
export type Kind = keyof typeof ext;

const file = (kind: Kind, name: string) => {
  if (!/^[\w-]+$/.test(name)) throw new Error(`Bad name: ${name}`);
  return join(/*turbopackIgnore: true*/ DATA_DIR, kind, name + ext[kind]);
};

export async function list(kind: Kind) {
  const files = await readdir(join(/*turbopackIgnore: true*/ DATA_DIR, kind)).catch(() => []);
  return files.filter((f) => f.endsWith(ext[kind])).map((f) => f.slice(0, -ext[kind].length));
}

export async function read(kind: Kind, name: string) {
  return readFile(file(kind, name), "utf8");
}

export async function write(kind: Kind, name: string, content: string) {
  const path = file(kind, name);
  await mkdir(join(/*turbopackIgnore: true*/ path, ".."), { recursive: true });
  await writeFile(path, content);
}

export async function defaultTemplate() {
  return (await run("pandoc", ["-D", "latex"])).stdout;
}

/** Compile HTML to PDF with pandoc. `template` is template text ("" = pandoc default). */
export async function renderPdf(html: string, title = "", template = "") {
  const dir = await mkdtemp(join(tmpdir(), "pandoc-"));
  try {
    const args = [join(dir, "in.html"), "-f", "html", "-o", join(dir, "out.pdf"), `--pdf-engine=${process.env.PDF_ENGINE ?? "pdflatex"}`];
    await writeFile(args[0]!, html);
    if (template) {
      await writeFile(join(dir, "t.tex"), template);
      args.push(`--template=${join(dir, "t.tex")}`);
    }
    if (title) args.push("-M", `title=${title}`);
    await run("pandoc", args);
    return { pdf: (await readFile(join(dir, "out.pdf"))).toString("base64") };
  } catch (e) {
    return { error: (e as { stderr?: string }).stderr || String(e) };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
