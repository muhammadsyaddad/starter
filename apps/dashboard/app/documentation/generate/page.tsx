"use client";

import { typeOut, useAgentActivity } from "@/components/agent-bridge";
import { DocEditor } from "@/components/doc-editor";
import { PdfPreview, type PdfResult } from "@/components/pdf-preview";
import { Button } from "@repo/ui/ui/button";
import { Input } from "@repo/ui/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/ui/select";
import { useEffect, useRef, useState, useTransition } from "react";
import { list, read, renderPdf, write } from "../actions";

// Radix Select forbids "" as an item value; stands in for "no template".
const pandocDefault = "__pandoc_default__";

export default function GenerateDocumentPage() {
  const [docs, setDocs] = useState<string[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [name, setName] = useState("untitled");
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("");
  const [html, setHtml] = useState("<p></p>");
  const [result, setResult] = useState<PdfResult>(null);
  const [busy, start] = useTransition();
  const [typing, setTyping] = useState(false);
  const cancelTyping = useRef<() => void>(undefined);

  const refresh = () => list("docs").then(setDocs);
  useEffect(() => {
    refresh();
    list("templates").then(setTemplates);
    return () => cancelTyping.current?.();
  }, []);

  // Mirror agent MCP calls so the user can watch.
  useAgentActivity((a) => {
    if (a.tool === "write" && a.kind === "docs" && a.phase === "done" && a.content) {
      cancelTyping.current?.();
      setName(a.name!);
      setTyping(true);
      cancelTyping.current = typeOut(a.content, (s) => {
        setHtml(s);
        if (s === a.content) setTyping(false);
      }, { html: true });
      refresh();
    }
    if (a.tool === "write" && a.kind === "templates" && a.phase === "done") list("templates").then(setTemplates);
    if (a.tool === "render_pdf") {
      if (a.phase === "start") setResult(null);
      if (a.phase === "done") setResult({ pdf: a.pdf });
      if (a.phase === "error") setResult({ error: a.error });
    }
  });

  const load = (doc: string) => doc && read("docs", doc).then((h) => (setName(doc), setHtml(h)));
  const save = () => start(() => write("docs", name, html).then(refresh));
  const preview = () =>
    start(async () => setResult(await renderPdf(html, title, template && (await read("templates", template)))));

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-3xl font-bold">Generate Document</h1>
      <div className="flex flex-wrap gap-2">
        <Select value="" onValueChange={load} disabled={!docs.length}>
          <SelectTrigger className="w-48" data-agent="load-doc">
            <SelectValue placeholder={docs.length ? "Load doc…" : "No saved docs"} />
          </SelectTrigger>
          <SelectContent>
            {docs.map((d) => <SelectItem key={d} value={d} data-agent={`doc:${d}`}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="w-40" placeholder="file name" value={name} onChange={(e) => setName(e.target.value)} data-agent="name" />
        <Input className="w-60" placeholder="title" value={title} onChange={(e) => setTitle(e.target.value)} data-agent="title" />
        <Select value={template || pandocDefault} onValueChange={(v) => setTemplate(v === pandocDefault ? "" : v)} disabled={!templates.length}>
          <SelectTrigger className="w-48" data-agent="template">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={pandocDefault} data-agent="template:default">pandoc default</SelectItem>
            {templates.map((t) => <SelectItem key={t} value={t} data-agent={`template:${t}`}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={save} disabled={busy || typing} data-agent="save">Save</Button>
        <Button onClick={preview} disabled={busy || typing} data-agent="preview">{busy ? "Working…" : "Preview PDF"}</Button>
      </div>
      <DocEditor value={html} onChange={setHtml} readOnly={typing} />
      <PdfPreview result={result} name={name} />
    </div>
  );
}
