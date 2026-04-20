"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, Pencil, Trash2, Search, Shield, User as UserIcon, Crown } from "lucide-react";
import {
  AdminModal, Label, TextInput, Select, FormFooter,
  RowMenu, MenuItem, useToast, Toast,
} from "@/components/admin/admin-ui";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  globalRole: "SUPER_ADMIN" | "ADMIN" | "EXPERT";
  createdAt: string;
  entities: { id: string; name: string }[];
};

export type AdminEntityOption = { id: string; name: string };

const ROLE_CONFIG: Record<string, { label: string; className: string; icon: typeof Shield }> = {
  SUPER_ADMIN: { label: "Super Admin", className: "bg-purple-100 text-purple-700", icon: Crown },
  ADMIN:       { label: "Admin",       className: "bg-blue-100 text-blue-700",     icon: Shield },
  EXPERT:      { label: "Expert",      className: "bg-gray-100 text-gray-700",     icon: UserIcon },
};

export function UsersClient({
  initial, entities, currentUserId,
}: {
  initial: AdminUser[];
  entities: AdminEntityOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; user?: AdminUser } | null>(null);
  const [, startTransition] = useTransition();
  const { toast, showToast } = useToast();

  const filtered = users.filter((u) =>
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete ${user.name ?? user.email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      showToast("err", error ?? "Failed to delete");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    showToast("ok", "User deleted");
    startTransition(() => router.refresh());
  }

  function handleSaved(saved: AdminUser, isNew: boolean) {
    if (isNew) setUsers((prev) => [saved, ...prev]);
    else setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
    setModal(null);
    showToast("ok", isNew ? "User created" : "User updated");
    startTransition(() => router.refresh());
  }

  const counts = {
    total: users.length,
    superAdmin: users.filter((u) => u.globalRole === "SUPER_ADMIN").length,
    admin: users.filter((u) => u.globalRole === "ADMIN").length,
    expert: users.filter((u) => u.globalRole === "EXPERT").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage user accounts and roles across the platform</p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          <UserPlus size={15} /> New User
        </button>
      </div>

      {/* Role counts */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, bg: "bg-gray-50", color: "text-gray-900", icon: UserIcon },
          { label: "Super Admins", value: counts.superAdmin, bg: "bg-purple-50", color: "text-purple-700", icon: Crown },
          { label: "Admins", value: counts.admin, bg: "bg-blue-50", color: "text-blue-700", icon: Shield },
          { label: "Experts", value: counts.expert, bg: "bg-green-50", color: "text-green-700", icon: UserIcon },
        ].map((s) => {
          const I = s.icon;
          return (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
                <I size={14} className={s.color} />
              </div>
              <p className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Organisation", "Joined", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => {
              const cfg = ROLE_CONFIG[u.globalRole];
              const I = cfg.icon;
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                        {(u.name ?? u.email)[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">
                        {u.name ?? "—"}
                        {isSelf && <span className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">You</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.className}`}>
                      <I size={10} /> {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {u.entities.length > 0 ? u.entities.map((e) => e.name).join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu>
                      {(close) => (
                        <>
                          <MenuItem icon={<Pencil size={12} />} onClick={() => { close(); setModal({ mode: "edit", user: u }); }}>
                            Edit
                          </MenuItem>
                          {!isSelf && (
                            <MenuItem icon={<Trash2 size={12} />} onClick={() => { close(); handleDelete(u); }} danger>
                              Delete
                            </MenuItem>
                          )}
                        </>
                      )}
                    </RowMenu>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <UserIcon size={20} className="text-gray-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {search ? "No users match your search" : "No users yet"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserFormModal
          user={modal.user}
          entities={entities}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}

function UserFormModal({
  user, entities, onClose, onSaved,
}: {
  user?: AdminUser;
  entities: AdminEntityOption[];
  onClose: () => void;
  onSaved: (u: AdminUser, isNew: boolean) => void;
}) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [globalRole, setGlobalRole] = useState<AdminUser["globalRole"]>(user?.globalRole ?? "EXPERT");
  const [entityId, setEntityId] = useState("");
  const [entityRole, setEntityRole] = useState<"ADMIN" | "EXPERT">("EXPERT");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users";
      const body = isEdit
        ? { name, globalRole }
        : { name, email, password: password || undefined, globalRole, entityId: entityId || undefined, entityRole };
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }

      const savedEntities = isEdit
        ? user!.entities
        : entityId
          ? [{ id: entityId, name: entities.find((e) => e.id === entityId)?.name ?? "" }]
          : [];

      onSaved({
        id: data.id,
        name: data.name,
        email: data.email,
        globalRole: data.globalRole,
        createdAt: data.createdAt ?? user?.createdAt ?? new Date().toISOString(),
        entities: savedEntities,
      }, !isEdit);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminModal open onClose={onClose} title={isEdit ? "Edit User" : "Invite User"} description={isEdit ? user!.email : "Create a new account"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div>
          <Label required>Email</Label>
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isEdit} />
        </div>
        {!isEdit && (
          <div>
            <Label>Temporary Password</Label>
            <TextInput type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank for invite-only" />
            <p className="mt-1 text-xs text-gray-500">If set, user can log in immediately with this password.</p>
          </div>
        )}
        <div>
          <Label>Global Role</Label>
          <Select value={globalRole} onChange={(e) => setGlobalRole(e.target.value as AdminUser["globalRole"])}>
            <option value="EXPERT">Expert (record emissions)</option>
            <option value="ADMIN">Admin (manage organisation)</option>
            <option value="SUPER_ADMIN">Super Admin (manage platform)</option>
          </Select>
        </div>
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assign Organisation</Label>
              <Select value={entityId} onChange={(e) => setEntityId(e.target.value)}>
                <option value="">— none —</option>
                {entities.map((ent) => <option key={ent.id} value={ent.id}>{ent.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Org Role</Label>
              <Select value={entityRole} onChange={(e) => setEntityRole(e.target.value as "ADMIN" | "EXPERT")}>
                <option value="EXPERT">Expert</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <FormFooter onCancel={onClose} submitLabel={isEdit ? "Save changes" : "Create user"} submitting={submitting} />
      </form>
    </AdminModal>
  );
}
