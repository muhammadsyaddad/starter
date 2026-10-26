"use client";

import * as React from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { CaretRightIcon, FileIcon, FilePdfIcon, FolderIcon, FolderPlusIcon } from "@phosphor-icons/react";
import { Button } from "@repo/ui/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/ui/dialog";
import { Field } from "@repo/ui/ui/field";
import { Input } from "@repo/ui/ui/input";
import { FormShell, ResourceTable } from "@/components/data-table";
import { DATE_MDY, avatar, date } from "@/components/cells";
import { PdfFrame } from "@/components/pdf-preview";
import { type Document, documentsApi } from "@/components/tables/documentation";
import { type Adapter, keyOf, keyed } from "@/lib/api";
import { MOCK, type Raw, fetchAll, request, toForm, useFetch } from "@/lib/http";
import { X, useAuth } from "@/lib/auth";

// File storage on the documentation backend: folders + one document per uploaded file.
export type StoredItem = {
  id: string;
  kind: "folder" | "file";
  name: string;
  /** Folder id; undefined = root. */
  parent?: string;
  created_by_name?: string;
  created_at: string;
  user_can_edit: boolean;
  user_can_delete: boolean;
  /** Upload only; never comes back from the API. */
  file?: File;
};

const PERM = "DOCUMENTATION";

const mock: StoredItem[] = [
  { id: "f1", kind: "folder", name: "Reports", created_by_name: "Demo Admin", created_at: "2026-10-01", user_can_edit: true, user_can_delete: true },
  { id: "d1", kind: "file", name: "Field Service Report.pdf", created_by_name: "Demo Admin", created_at: "2026-10-02", user_can_edit: true, user_can_delete: true },
  { id: "d2", kind: "file", name: "BA-September.pdf", parent: "f1", created_by_name: "Demo Viewer", created_at: "2026-09-10", user_can_edit: false, user_can_delete: false },
];

const isPdf = (x: StoredItem) => x.kind === "file" && x.name.toLowerCase().endsWith(".pdf");

const folderFrom = (f: Raw): StoredItem => ({
  id: f.id,
  kind: "folder",
  name: f.name,
  parent: f.parent_id ?? undefined,
  created_by_name: f.created_by_name,
  created_at: f.created_at,
  user_can_edit: !!f.user_can_edit,
  user_can_delete: !!f.user_can_delete,
});

const fileFrom = (d: Raw): StoredItem => ({
  id: d.id,
  kind: "file",
  name: d.title,
  parent: d.folder_id ?? undefined,
  created_by_name: d.created_by_name,
  created_at: d.created_at,
  user_can_edit: !!d.user_can_edit,
  user_can_delete: !!d.user_can_delete,
});

// Folders first, then by name.
const sorted = (rows: StoredItem[]) =>
  rows.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "folder" ? -1 : 1));

/** Only the file; the rest is the minimum POST documentation needs. */
const upload = (x: StoredItem) =>
  request("documentation", {
    method: "POST",
    body: toForm({
      doc_id: `DRAFT-${format(new Date(), "ddMMyy")}-${crypto.randomUUID().slice(0, 8)}`,
      doc_type: "DRAFT",
      title: x.name,
      status: "PENDING",
      is_public: "false",
      folder_id: x.parent,
      files: x.file,
    }),
  });

/** Rename goes through the full document so other fields are sent back unchanged. */
const renameFile = async (x: StoredItem) => {
  const full = await documentsApi.get!({ id: x.id } as Document);
  return documentsApi.save!({ ...full, title: x.name });
};

const saveFolder = (x: StoredItem) =>
  request(x.id ? `folders/${x.id}` : "folders", {
    method: x.id ? "PUT" : "POST",
    body: { name: x.name, parent_id: x.parent ?? null },
  });

/** Root: folder and documentation lists have no parent filter, so filter here. */
const filesApi = (cwd?: string): Adapter<StoredItem> => {
  const kinds = new Map<string, StoredItem["kind"]>();
  return {
    perm: PERM,
    list: keyed(["files", cwd], async () => {
      const rows = cwd
        ? await request(`folders/${cwd}`).then(({ data }) => [
            ...(data.sub_folders ?? []).map(folderFrom),
            ...(data.documents ?? []).map(fileFrom),
          ])
        : await Promise.all([request<Raw[]>("folders"), fetchAll("documentation")]).then(([f, d]) => [
            ...(f.data ?? []).map(folderFrom).filter((x) => !x.parent),
            ...d.map(fileFrom).filter((x) => !x.parent),
          ]);
      for (const x of rows) kinds.set(x.id, x.kind);
      return sorted(rows);
    }),
    save: (x) => (x.kind === "folder" ? saveFolder(x) : x.id ? renameFile(x) : upload(x)),
    remove: (id) => request(`${kinds.get(id) === "folder" ? "folders" : "documentation"}/${id}`, { method: "DELETE" }),
  };
};

export const FilesTable = () => {
  const [trail, setTrail] = React.useState<{ id: string; name: string }[]>([]);
  const cwd = trail.at(-1)?.id;
  const api = React.useMemo(() => filesApi(cwd), [cwd]);
  const [newFolder, setNewFolder] = React.useState(false);
  const [previewing, setPreviewing] = React.useState<StoredItem>();
  const queryClient = useQueryClient();
  const { can } = useAuth();

  const open = (x: StoredItem) => setTrail((t) => [...t, { id: x.id, name: x.name }]);

  return (
    <>
      <ResourceTable
        key={cwd ?? "root"}
        title="Files"
        adapter={api}
        mock={sorted(mock.filter((x) => x.parent === cwd))}
        columns={[
          {
            header: "Name",
            sort: "name",
            cell: (x) =>
              x.kind === "folder" ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 font-medium hover:underline"
                  onClick={() => open(x)}
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
          avatar<StoredItem>("created_by_name", "Created By"),
          date("created_at", "Created At", DATE_MDY),
        ]}
        search={(x) => x.name}
        placeholder="Search files..."
        addLabel="Upload File"
        can={(x, action) => (action === "edit" ? x.user_can_edit : x.user_can_delete)}
        toolbar={
          <>
            <nav className="flex flex-1 items-center gap-1 text-sm text-muted-foreground">
              {[{ id: "root", name: "My Files" }, ...trail].map((f, i) => (
                <React.Fragment key={f.id}>
                  {i > 0 && <CaretRightIcon className="size-3" />}
                  <button
                    type="button"
                    className={i === trail.length ? "font-medium text-foreground" : "hover:underline"}
                    onClick={() => setTrail((t) => t.slice(0, i))}
                  >
                    {f.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
            {!MOCK && can(PERM, X) && (
              <Button variant="outline" size="sm" onClick={() => setNewFolder(true)}>
                <FolderPlusIcon /> New Folder
              </Button>
            )}
          </>
        }
        renderDialog={(p) => (
          <UploadDialog
            key={p.row?.id ?? "new"}
            {...p}
            cwd={cwd}
            onUpload={async (rows) => {
              // Mock: local rows via the table. Live: save all, then one reload.
              if (MOCK) return void (await Promise.all(rows.map(p.onSave)));
              try {
                for (const r of rows) await api.save!(r);
              } finally {
                await queryClient.invalidateQueries({ queryKey: keyOf(api) });
              }
            }}
          />
        )}
        noun="items"
        emptyLabel="This folder is empty"
      />
      <FormShell
        open={newFolder}
        title="New Folder"
        onClose={() => setNewFolder(false)}
        onSubmit={async (f) => {
          await api.save!({
            id: "",
            kind: "folder",
            name: String(f.get("name")).trim(),
            parent: cwd,
            created_at: "",
            user_can_edit: true,
            user_can_delete: true,
          });
          await queryClient.invalidateQueries({ queryKey: keyOf(api) });
        }}
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
  const { data, loading, error } = useFetch(MOCK ? undefined : `documentation/${item.id}`);
  const file = data?.attachments?.[0];
  if (MOCK) return <p className="text-sm text-muted-foreground">Preview unavailable in mock mode.</p>;
  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (error) return <p className="text-sm text-destructive">Failed to load: {error}</p>;
  return file ? (
    <PdfFrame url={`/be-api/documentation/attachments/${file.id}/download`} file={file.file_name ?? item.name} />
  ) : (
    <p className="text-sm text-muted-foreground">No attachment.</p>
  );
}

// New row = upload (one document per file), existing row = rename.
function UploadDialog({
  row,
  cwd,
  onClose,
  onSave,
  onUpload,
}: {
  row?: Partial<StoredItem>;
  cwd?: string;
  onClose: () => void;
  onSave: (x: StoredItem) => Promise<void>;
  onUpload: (rows: StoredItem[]) => Promise<void>;
}) {
  const editing = !!row?.id;
  return (
    <FormShell
      open={!!row}
      title={editing ? `Rename ${row.kind === "folder" ? "Folder" : "File"}` : "Upload File"}
      onClose={onClose}
      onSubmit={async (f) => {
        if (editing) return onSave({ ...(row as StoredItem), name: String(f.get("name")).trim() });
        return onUpload(
          (f.getAll("files") as File[])
            .filter((x) => x.size || x.name)
            .map((file) => ({
              id: "",
              kind: "file",
              name: file.name,
              parent: cwd,
              created_at: new Date().toISOString(),
              user_can_edit: true,
              user_can_delete: true,
              file,
            })),
        );
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
