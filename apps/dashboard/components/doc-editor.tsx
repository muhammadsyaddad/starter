"use client";

import { Button } from "@repo/ui/ui/button";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export function DocEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (html: string) => void;
  /** Locks the editor, e.g. while the agent's content is being typed in. */
  readOnly?: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "min-h-96 p-4 outline-none", "data-agent": "editor" } },
  });

  // Sync when value is replaced from outside (e.g. Load, agent typing). No emitUpdate: parent already has it.
  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  if (!editor) return null;
  const c = () => editor.chain().focus();
  const tools = [
    ["H1", () => c().toggleHeading({ level: 1 }).run()],
    ["H2", () => c().toggleHeading({ level: 2 }).run()],
    ["B", () => c().toggleBold().run()],
    ["I", () => c().toggleItalic().run()],
    ["• List", () => c().toggleBulletList().run()],
    ["1. List", () => c().toggleOrderedList().run()],
    ["Quote", () => c().toggleBlockquote().run()],
    ["Code", () => c().toggleCodeBlock().run()],
  ] as const;

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap gap-1 border-b p-2">
        {tools.map(([label, fn]) => (
          <Button key={label} size="sm" variant="ghost" onClick={fn}>
            {label}
          </Button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className="[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ul]:list-disc [&_li]:ml-6 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_pre]:bg-muted [&_pre]:p-2"
      />
    </div>
  );
}
