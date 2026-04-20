"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Building2, Users, Database, Pencil, Trash2, Search,
  CheckCircle, AlertCircle, Clock,
} from "lucide-react";
import {
  AdminModal, Label, TextInput, Select, FormFooter,
  RowMenu, MenuItem, useToast, Toast,
} from "@/components/admin/admin-ui";

export type AdminEntity = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  country: string | null;
  subscriptionStatus: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID";
  createdAt: string;
  userCount: number;
  recordCount: number;
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  ACTIVE:    { label: "Active",    className: "bg-green-50 border-green-200 text-green-700", icon: CheckCircle },
  TRIALING:  { label: "Trialing",  className: "bg-blue-50 border-blue-200 text-blue-700",    icon: Clock },
  PAST_DUE:  { label: "Past due",  className: "bg-amber-50 border-amber-200 text-amber-700", icon: AlertCircle },
  CANCELED:  { label: "Canceled",  className: "bg-red-50 border-red-200 text-red-700",       icon: AlertCircle },
  UNPAID:    { label: "Unpaid",    className: "bg-red-50 border-red-200 text-red-700",       icon: AlertCircle },
};

export function EntitiesClient({ initial }: { initial: AdminEntity[] }) {
  const router = useRouter();
  const [entities, setEntities] = useState(initial);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; entity?: AdminEntity } | null>(null);
  const [, startTransition] = useTransition();
  const { toast, showToast } = useToast();

  const filtered = entities.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.slug.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(entity: AdminEntity) {
    if (!confirm(`Delete ${entity.name}? This will remove all its users, records and reports.`)) return;
    const res = await fetch(`/api/admin/entities/${entity.id}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      showToast("err", error ?? "Failed to delete");
      return;
    }
    setEntities((prev) => prev.filter((e) => e.id !== entity.id));
    showToast("ok", `${entity.name} deleted`);
    startTransition(() => router.refresh());
  }

  function handleSaved(saved: AdminEntity, isNew: boolean) {
    if (isNew) {
      setEntities((prev) => [saved, ...prev]);
    } else {
      setEntities((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
    }
    setModal(null);
    showToast("ok", isNew ? "Organisation created" : "Organisation updated");
    startTransition(() => router.refresh());
  }

  const counts = {
    total: entities.length,
    active: entities.filter((e) => e.subscriptionStatus === "ACTIVE").length,
    trialing: entities.filter((e) => e.subscriptionStatus === "TRIALING").length,
    churned: entities.filter((e) => ["CANCELED", "UNPAID"].includes(e.subscriptionStatus)).length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all tenant organisations on the platform</p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          <Plus size={15} /> New Organisation
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, icon: Building2, color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Active", value: counts.active, icon: CheckCircle, color: "text-green-700", bg: "bg-green-50" },
          { label: "Trialing", value: counts.trialing, icon: Clock, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Churned", value: counts.churned, icon: AlertCircle, color: "text-red-700", bg: "bg-red-50" },
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

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or slug…"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Organisation", "Slug", "Industry", "Country", "Status", "Users", "Records", "Created", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((e) => {
              const cfg = STATUS_CONFIG[e.subscriptionStatus];
              const I = cfg.icon;
              return (
                <tr key={e.id} className="group hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-xs font-bold text-white">
                        {e.name[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{e.slug}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.industry ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.className}`}>
                      <I size={10} /> {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{e.userCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{e.recordCount}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu>
                      {(close) => (
                        <>
                          <MenuItem icon={<Pencil size={12} />} onClick={() => { close(); setModal({ mode: "edit", entity: e }); }}>
                            Edit
                          </MenuItem>
                          <MenuItem icon={<Trash2 size={12} />} onClick={() => { close(); handleDelete(e); }} danger>
                            Delete
                          </MenuItem>
                        </>
                      )}
                    </RowMenu>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Database size={20} className="text-gray-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {search ? "No organisations match your search" : "No organisations yet"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {!search && "Create your first organisation to get started."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <EntityFormModal
          entity={modal.entity}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}

// ─── Modal form ───────────────────────────────────────────────────────────────

function EntityFormModal({
  entity, onClose, onSaved,
}: {
  entity?: AdminEntity;
  onClose: () => void;
  onSaved: (e: AdminEntity, isNew: boolean) => void;
}) {
  const isEdit = !!entity;
  const [name, setName] = useState(entity?.name ?? "");
  const [slug, setSlug] = useState(entity?.slug ?? "");
  const [industry, setIndustry] = useState(entity?.industry ?? "");
  const [country, setCountry] = useState(entity?.country ?? "");
  const [status, setStatus] = useState(entity?.subscriptionStatus ?? "TRIALING");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = isEdit ? `/api/admin/entities/${entity!.id}` : "/api/admin/entities";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug: slug || undefined, industry, country, subscriptionStatus: status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save");
        return;
      }
      onSaved(
        {
          ...data,
          userCount: entity?.userCount ?? 0,
          recordCount: entity?.recordCount ?? 0,
          createdAt: data.createdAt ?? entity?.createdAt,
        },
        !isEdit
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminModal open onClose={onClose} title={isEdit ? "Edit Organisation" : "New Organisation"} description={isEdit ? entity!.name : "Create a new tenant organisation"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label required>Name</Label>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required placeholder="Acme Corp" />
        </div>
        <div>
          <Label>Slug</Label>
          <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-corp (auto-generated if empty)" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Industry</Label>
            <TextInput value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Manufacturing" />
          </div>
          <div>
            <Label>Country</Label>
            <TextInput value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United Kingdom" />
          </div>
        </div>
        <div>
          <Label>Subscription Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as AdminEntity["subscriptionStatus"])}>
            <option value="TRIALING">Trialing</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past due</option>
            <option value="CANCELED">Canceled</option>
            <option value="UNPAID">Unpaid</option>
          </Select>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormFooter onCancel={onClose} submitLabel={isEdit ? "Save changes" : "Create organisation"} submitting={submitting} />
      </form>
    </AdminModal>
  );
}
