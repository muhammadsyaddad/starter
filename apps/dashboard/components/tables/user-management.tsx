"use client";

import * as React from "react";
import { Button } from "@repo/ui/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/ui/dialog";
import { Field } from "@repo/ui/ui/field";
import { Input } from "@repo/ui/ui/input";
import { ResourceTable } from "@/components/data-table";
import { DATE_DMY, date, dot, index, text, twoLine, badge } from "@/components/cells";
import { type Adapter, rest, useResource } from "@/lib/api";
import { cap, lower, request, useOptions } from "@/lib/http";
import { ACTIVE_INACTIVE, PAGE_KEYS, PERM_ACTION, ROLE, labels } from "@/lib/enums";

/** Label map keyed by the label itself (rows hold names, not ids). */
const byName = (o: Record<string, string>) =>
  Object.fromEntries(Object.values(o).map((n) => [n, n]));

// T01
type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: string;
  role_id: string;
  division: string;
  division_id: string;
  status: "Active" | "Inactive";
  lastLogin: string;
};

const STATUS = { Active: "Active", Inactive: "Inactive" };
const ROLE_SOURCE = "user-management/dropdown-role";
const DIVISION_SOURCE = "user-management/dropdown-division";

const users: User[] = [
  { id: "1", name: "Demo Admin", username: "admin", email: "admin@example.com", role: "SUPER ADMIN", role_id: "", division: "Engineering", division_id: "", status: "Active", lastLogin: "-" },
  { id: "2", name: "Demo Viewer", username: "viewer", email: "viewer@example.com", role: "VIEWER", role_id: "", division: "Finance", division_id: "", status: "Inactive", lastLogin: "-" },
];

// List has role / division names; the detail has objects (and the only division id).
const name = (v: unknown) => (typeof v === "string" ? v : (v as { name?: string })?.name ?? "");
export const usersApi = rest<User>(
  "user-management/user",
  "USERS",
  (u) => ({
    id: u.id,
    name: u.fullName || u.username,
    username: u.username,
    email: u.email,
    role: name(u.role),
    role_id: u.role_id ?? u.role?.id ?? "",
    division: name(u.division) || "-",
    division_id: u.division?.id ?? "",
    status: lower(u.status) === "active" ? "Active" : "Inactive",
    lastLogin: "-", // backend has no last login
  }),
  {
    detail: true,
    toApi: (u) => ({
      username: u.username,
      email: u.email,
      fullName: u.name,
      password: u.password || undefined,
      role_id: u.role_id,
      division_id: u.division_id,
      status: lower(u.status),
    }),
  },
);

export function UsersTable() {
  const roles = byName(useOptions(ROLE_SOURCE, labels(ROLE)));
  const divisions = byName(useOptions(DIVISION_SOURCE, { Engineering: "Engineering", Finance: "Finance" }));
  return (
    <ResourceTable
      title="Users"
      adapter={usersApi}
      mock={users}
      columns={[
        index(),
        twoLine("USER", "name", "email", true),
        badge("role", "ROLE", ROLE, true),
        text("division", "DIVISION", true),
        dot("status", "STATUS", (v) => v === "Active", true),
        text("lastLogin", "LAST LOGIN"),
      ]}
      actionsHeader="ACTIONS"
      search={(u) => `${u.name} ${u.email} ${u.role}`}
      placeholder="Search users by name, email, or role..."
      filters={[
        { key: "role", options: roles, allLabel: "All Roles" },
        { key: "division", options: divisions, allLabel: "All Divisions" },
        { key: "status", options: STATUS, allLabel: "All Status" },
      ]}
      fields={[
        { key: "name", label: "Full Name" },
        { key: "username", label: "Username" },
        { key: "email", label: "Email", type: "email" },
        { key: "password", label: "Password", type: "password", on: "create" },
        { key: "password", label: "New Password", type: "password", optional: true, on: "edit" },
        { key: "role_id", label: "Role", source: ROLE_SOURCE },
        { key: "division_id", label: "Division", source: DIVISION_SOURCE },
        { key: "status", label: "Status", options: STATUS },
      ]}
      detailHref={(u) => `/user-management/users/${u.id}`}
      noun="users"
    />
  );
}

// T02
type Division = {
  id: string;
  name: string;
  division_head: string;
  description: string;
  staff: number;
  createdAt: string;
};

const divisions: Division[] = [
  { id: "1", name: "Engineering", division_head: "Demo Head", description: "", staff: 12, createdAt: "2026-01-10" },
  { id: "2", name: "Finance", division_head: "Demo Head", description: "", staff: 4, createdAt: "2026-02-03" },
];

// `staff` is counted by the backend.
export const divisionsApi = rest<Division>(
  "user-management/division",
  "DIVISION",
  (d) => ({ ...d, division_head: d.division_head ?? "", description: d.description ?? "" }),
  { toApi: ({ name, division_head, description }) => ({ name, division_head, description }) },
);

export const DivisionsTable = () => (
  <ResourceTable
    title="Divisions"
    adapter={divisionsApi}
    mock={divisions}
    columns={[
      index(),
      text("name", "DIVISION NAME", true),
      text("division_head", "HEAD OF DIVISION", true),
      text("staff", "STAFF", true),
      date("createdAt", "CREATED AT", DATE_DMY, true),
    ]}
    actionsHeader="ACTIONS"
    search={(d) => d.name}
    placeholder="Search divisions..."
    fields={[
      { key: "name", label: "Division Name" },
      { key: "division_head", label: "Head of Division", optional: true },
      { key: "description", label: "Description", optional: true },
    ]}
    detailHref={(d) => `/user-management/divisions/${d.id}`}
    noun="divisions"
  />
);

// T03 — members are free-text people, not users.
type Member = { id: string; name: string; position: string; status: "active" | "inactive" };

const MEMBERS = "user-management/division/member";
const membersApi = (divisionId: string): Adapter<Member> => ({
  ...rest<Member>(
    MEMBERS,
    "DIVISION",
    (m) => ({ id: m.id, name: m.name, position: m.position ?? "", status: lower(m.status) as Member["status"] }),
    { params: { division_id: divisionId } },
  ),
  // Create is a bulk endpoint.
  save: ({ id, name, position, status }) =>
    id
      ? request(`${MEMBERS}/${id}`, { method: "PATCH", body: { name, position, status: cap(status) } })
      : request(MEMBERS, {
          method: "POST",
          body: { division_id: divisionId, members: [{ name, position, status: cap(status) }] },
        }),
});

export function DivisionMembersTable({ divisionId }: { divisionId: string }) {
  const adapter = React.useMemo(() => membersApi(divisionId), [divisionId]);
  return (
    <ResourceTable
      title="Members"
      adapter={adapter}
      mock={[]}
      columns={[
        text("name", "NAME"),
        text("position", "POSITION"),
        badge("status", "STATUS", ACTIVE_INACTIVE),
      ]}
      fields={[
        { key: "name", label: "Name" },
        { key: "position", label: "Position", optional: true },
        { key: "status", label: "Status", options: labels(ACTIVE_INACTIVE) },
      ]}
      noun="members"
      emptyLabel="No members found in this division."
    />
  );
}

// T04 — guarded by ROLE_MANAGEMENT, not PERMISSION.
type Permission = {
  id: string;
  name: string;
  resource_type: string;
  resource_identifier: string;
  action?: number;
};

export const permissionsApi = rest<Permission>(
  "user-management/permission",
  "ROLE_MANAGEMENT",
  (p) => p,
  {
    detail: true,
    toApi: ({ name, resource_type, resource_identifier, action }) => ({
      name,
      resource_type,
      resource_identifier,
      action: Number(action),
    }),
  },
);

export const PermissionsTable = () => (
  <ResourceTable
    title="Permissions"
    adapter={permissionsApi}
    mock={[]}
    columns={[
      text("name", "NAME", true),
      badge("resource_type", "RESOURCE TYPE"),
      text("resource_identifier", "IDENTIFIER"),
    ]}
    addLabel="Add Permission"
    search={(p) => `${p.name} ${p.resource_identifier}`}
    placeholder="Search permissions..."
    fields={[
      { key: "name", label: "Name" },
      { key: "resource_type", label: "Resource Type", options: { PAGE: "PAGE", COMPONENT: "COMPONENT" } },
      { key: "resource_identifier", label: "Identifier", options: PAGE_KEYS },
      { key: "action", label: "Action", options: PERM_ACTION },
    ]}
    noun="permissions"
    emptyLabel="No permissions found"
  />
);

// Roles
type Role = {
  id: string;
  name: string;
  description: string;
  permissions: number;
  permission_ids: string[];
};

const roles: Role[] = [
  { id: "1", name: "SUPER ADMIN", description: "", permissions: 40, permission_ids: [] },
  { id: "2", name: "VIEWER", description: "", permissions: 8, permission_ids: [] },
];

// Bare array, permissions preloaded. permission_ids replaces the full set.
export const rolesApi = rest<Role>(
  "user-management/role",
  "ROLE_MANAGEMENT",
  (r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    permissions: (r.permissions ?? []).length,
    permission_ids: (r.permissions ?? []).map((p: Permission) => p.id),
  }),
  { toApi: ({ name, description, permission_ids }) => ({ name, description, permission_ids }) },
);

export const RolesTable = () => (
  <ResourceTable
    title="Roles"
    adapter={rolesApi}
    mock={roles}
    columns={[
      index(),
      text("name", "ROLE NAME", true),
      text("description", "DESCRIPTION"),
      text("permissions", "PERMISSIONS", true),
    ]}
    actionsHeader="ACTIONS"
    search={(r) => r.name}
    placeholder="Search roles..."
    renderDialog={(p) => <RoleDialog key={p.row?.id ?? "new"} {...p} />}
    noun="roles"
  />
);

// T05 — permission picker inside the role dialog.
function RoleDialog({
  row,
  onClose,
  onSave,
}: {
  row?: Partial<Role>;
  onClose: () => void;
  onSave: (r: Role) => Promise<void>;
}) {
  const { items } = useResource(row ? permissionsApi : undefined, []);
  const [picked, setPicked] = React.useState(() => new Set(row?.permission_ids));
  const [q, setQ] = React.useState("");
  const [error, setError] = React.useState<string>();
  const shown = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = (ids: string[], on: boolean) =>
    setPicked((s) => {
      const next = new Set(s);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await onSave({
                ...(row as Role),
                name: String(f.get("name")),
                description: String(f.get("description")),
                permission_ids: [...picked],
              });
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{row?.id ? "Edit" : "New"} Role</DialogTitle>
            {error && <DialogDescription className="text-destructive">{error}</DialogDescription>}
          </DialogHeader>
          <Field label="Role Name">
            <Input name="name" defaultValue={row?.name} required />
          </Field>
          <Field label="Description">
            <Input name="description" defaultValue={row?.description} required />
          </Field>
          <div className="flex items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search permissions..." />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggle(shown.map((p) => p.id), !shown.every((p) => picked.has(p.id)))}
            >
              {q ? "Select All Filtered" : "Select All"}
            </Button>
          </div>
          <div className="grid max-h-64 gap-1 overflow-y-auto text-sm">
            {shown.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={picked.has(p.id)}
                  onChange={(e) => toggle([p.id], e.target.checked)}
                />
                {p.name}
              </label>
            ))}
          </div>
          <DialogFooter>
            <span className="mr-auto text-xs text-muted-foreground">{picked.size} permissions selected</span>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
