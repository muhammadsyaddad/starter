"use client";

import * as React from "react";
import { CaretRightIcon, FileIcon, FilePdfIcon, FolderIcon, FolderPlusIcon } from "@phosphor-icons/react";
import { Button } from "@repo/ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/ui/dialog";
import { Field } from "@repo/ui/ui/field";
import { Input } from "@repo/ui/ui/input";
import { DataTable, FormShell } from "@/components/data-table";
import { DATE_MDY, date } from "@/components/cells";
import { PdfFrame } from "@/components/pdf-preview";

// File storage. Local state only until the API exists.
export type StoredItem = {
  id: string;
  kind: "folder" | "file";
  name: string;
  /** Folder id; undefined = root. */
  parent?: string;
  size?: number;
  created_at: string;
  /** Uploaded content; folders have none. */
  blob?: File;
};

const isPdf = (x: StoredItem) => x.kind === "file" && x.name.toLowerCase().endsWith(".pdf");

const now = () => new Date().toISOString();

const fmtSize = (n?: number) =>
  n === undefined ? "—" : n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`;

/** Item plus everything under it, for delete. */
const subtree = (all: StoredItem[], id: string): Set<string> => {
  const out = new Set([id]);
  for (let grew = true; grew; ) {
    grew = false;
    for (const x of all) {
      if (x.parent && out.has(x.parent) && !out.has(x.id)) {
        out.add(x.id);
        grew = true;
      }
    }
  }
  return out;
};

export const FilesTable = () => {
  const [all, setAll] = React.useState<StoredItem[]>([]);
  const [cwd, setCwd] = React.useState<string>();
  const [newFolder, setNewFolder] = React.useState(false);
  const [previewing, setPreviewing] = React.useState<StoredItem>();

  const trail: StoredItem[] = [];
  for (let id = cwd; id; ) {
    const f = all.find((x) => x.id === id);
    if (!f) break;
    trail.unshift(f);
    id = f.parent;
  }

  // Folders first, then by name.
  const items = all
    .filter((x) => x.parent === cwd)
    .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1));

  const add = (rows: StoredItem[]) => setAll((s) => [...s, ...rows]);

  return (
    <>
      <DataTable
        title="Files"
        items={items}
        columns={[
          {
            header: "Name",
            sort: "name",
            cell: (x) =>
              x.kind === "folder" ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 font-medium hover:underline"
                  onClick={() => setCwd(x.id)}
                >
                  <FolderIcon weight="fill" className="size-4 text-primary" /> {x.name}
                </button>
              ) : isPdf(x) ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 hover:underline"
                  onClick={() => setPreviewing(x)}
                >
                  <FilePdfIcon className="size-4 text-destructive" /> {x.name}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <FileIcon className="size-4 text-muted-foreground" /> {x.name}
                </span>
              ),
          },
          { header: "Size", cell: (x) => (x.kind === "folder" ? "—" : fmtSize(x.size)) },
          date("created_at", "Created At", DATE_MDY),
        ]}
        search={(x) => x.name}
        placeholder="Search files..."
        addLabel="Upload File"
        toolbar={
          <>
            <nav className="flex flex-1 items-center gap-1 text-sm text-muted-foreground">
              {[{ id: undefined, name: "My Files" }, ...trail].map((f, i) => (
                <React.Fragment key={f.id ?? "root"}>
                  {i > 0 && <CaretRightIcon className="size-3" />}
                  <button
                    type="button"
                    className={i === trail.length ? "font-medium text-foreground" : "hover:underline"}
                    onClick={() => setCwd(f.id)}
                  >
                    {f.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
            <Button variant="outline" size="sm" onClick={() => setNewFolder(true)}>
              <FolderPlusIcon /> New Folder
            </Button>
          </>
        }
        renderDialog={(p) => (
          <UploadDialog
            key={p.row?.id ?? "new"}
            {...p}
            onUpload={(files) => {
              add(
                files.map((f) => ({
                  id: crypto.randomUUID(),
                  kind: "file",
                  name: f.name,
                  parent: cwd,
                  size: f.size,
                  created_at: now(),
                  blob: f,
                })),
              );
              p.onClose();
            }}
          />
        )}
        onSave={(r) => setAll((s) => s.map((x) => (x.id === r.id ? r : x)))}
        onDelete={(id) =>
          setAll((s) => {
            const gone = subtree(s, id);
            return s.filter((x) => !gone.has(x.id));
          })
        }
        noun="items"
        emptyLabel="This folder is empty"
      />
      <FormShell
        open={newFolder}
        title="New Folder"
        onClose={() => setNewFolder(false)}
        onSubmit={async (f) =>
          add([{ id: crypto.randomUUID(), kind: "folder", name: String(f.get("name")).trim(), parent: cwd, created_at: now() }])
        }
      >
        <Field label="Folder Name">
          <Input name="name" required autoFocus />
        </Field>
      </FormShell>
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(undefined)}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{previewing?.name}</DialogTitle>
          </DialogHeader>
          {previewing && <FilePreview key={previewing.id} item={previewing} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

function FilePreview({ item }: { item: StoredItem }) {
  const url = React.useMemo(() => item.blob && URL.createObjectURL(item.blob), [item.blob]);
  React.useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url ? <PdfFrame url={url} file={item.name} /> : null;
}

// New row = upload, existing row = rename.
function UploadDialog({
  row,
  onClose,
  onSave,
  onUpload,
}: {
  row?: Partial<StoredItem>;
  onClose: () => void;
  onSave: (x: StoredItem) => Promise<void>;
  onUpload: (files: File[]) => void;
}) {
  const editing = !!row?.id;
  return (
    <FormShell
      open={!!row}
      title={editing ? `Rename ${row.kind === "folder" ? "Folder" : "File"}` : "Upload File"}
      onClose={onClose}
      onSubmit={async (f) => {
        if (editing) return onSave({ ...(row as StoredItem), name: String(f.get("name")).trim() });
        onUpload((f.getAll("files") as File[]).filter((x) => x.size || x.name));
      }}
    >
      {editing ? (
        <Field label="Name">
          <Input name="name" defaultValue={row.name} required autoFocus />
        </Field>
      ) : (
        <Field label="Files">
          <Input name="files" type="file" multiple required />
        </Field>
      )}
    </FormShell>
  );
}
