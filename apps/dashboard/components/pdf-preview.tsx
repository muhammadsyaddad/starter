"use client";

import { useMemo } from "react";

export type PdfResult = { pdf?: string; error?: string } | null;

export function PdfPreview({ result, name = "document" }: { result: PdfResult; name?: string }) {
  const url = useMemo(() => {
    if (!result?.pdf) return "";
    const bytes = Uint8Array.from(atob(result.pdf), (ch) => ch.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  }, [result]);

  if (result?.error) return <pre className="overflow-auto rounded-md border p-3 text-xs text-destructive">{result.error}</pre>;
  if (!url) return null;
  return (
    <div className="flex flex-col gap-2">
      <a href={url} download={`${name}.pdf`} className="text-sm underline">
        Download {name}.pdf
      </a>
      <iframe src={url} className="h-[80vh] w-full rounded-md border" />
    </div>
  );
}
