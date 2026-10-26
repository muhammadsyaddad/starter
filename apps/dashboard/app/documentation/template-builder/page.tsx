"use client";

import { typeOut, useAgentActivity } from "@/components/agent-bridge";
import { PdfPreview, type PdfResult } from "@/components/pdf-preview";
import { Button } from "@repo/ui/ui/button";
import { Input } from "@repo/ui/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/ui/select";
import { useEffect, useRef, useState, useTransition } from "react";
import { defaultTemplate, list, read, renderPdf, write } from "../actions";

const sample = "<h1>Heading</h1><p>Sample <strong>bold</strong> and <em>italic</em> text.</p><ul><li>One</li><li>Two</li></ul>";

export default function TemplateBuilderPage() {
  const [templates, setTemplates] = useState<string[]>([]);
  const [name, setName] = useState("default");
  const [text, setText] = useState("");
  const [result, setResult] = useState<PdfResult>(null);
  const [busy, start] = useTransition();
  const [typing, setTyping] = useState(false);
  const cancelTyping = useRef<() => void>(undefined);

  const refresh = () => list("templates").then(setTemplates);
  useEffect(() => {
    refresh();
    return () => cancelTyping.current?.();
  }, []);

  // Mirror agent MCP calls so the user can watch.
  useAgentActivity((a) => {
    if (a.tool === "write" && a.kind === "templates" && a.phase === "done" && a.content) {
      cancelTyping.current?.();
      setName(a.name!);
      setTyping(true);
      cancelTyping.current = typeOut(a.content, (s) => {
        setText(s);
        if (s === a.content) setTyping(false);
      });
      refresh();
    }
    if (a.tool === "render_pdf") {
      if (a.phase === "start") setResult(null);
      if (a.phase === "done") setResult({ pdf: a.pdf });
      if (a.phase === "error") setResult({ error: a.error });
    }
  });

  const load = (t: string) => t && read("templates", t).then((s) => (setName(t), setText(s)));
  const save = () => start(() => write("templates", name, text).then(refresh));
  const test = () => start(async () => setResult(await renderPdf(sample, "Template Test", text)));

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-3xl font-bold">Template Builder</h1>
      <div className="flex flex-wrap gap-2">
        <Select value="" onValueChange={load}>
          <SelectTrigger className="w-48" data-agent="load-template">
            <SelectValue placeholder="Load template…" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => <SelectItem key={t} value={t} data-agent={`template:${t}`}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="w-40" placeholder="name" value={name} onChange={(e) => setName(e.target.value)} data-agent="name" />
        <Button variant="outline" onClick={() => defaultTemplate().then(setText)} data-agent="pandoc-default">Start from pandoc default</Button>
        <Button variant="outline" onClick={save} disabled={busy || typing} data-agent="save">Save</Button>
        <Button onClick={test} disabled={busy || typing} data-agent="test">{busy ? "Working…" : "Test"}</Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Pandoc LaTeX template. Variables: <code>$title$ $author$ $date$ $body$ $if(x)$…$endif$</code>
      </p>
      <textarea
        className="h-[50vh] w-full rounded-md border bg-transparent p-3 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={typing}
        spellCheck={false}
        data-agent="source"
      />
      <PdfPreview result={result} name={name} />
    </div>
  );
}
