"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Flame, Zap, Globe, Layers, ToggleLeft, ToggleRight } from "lucide-react";
import {
  AdminModal, Label, TextInput, TextArea, FormFooter,
  RowMenu, MenuItem, useToast, Toast,
} from "@/components/admin/admin-ui";

export type AdminActivity = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  equation: string;
  isActive: boolean;
  sortOrder: number;
  factorCount: number;
};

export type AdminScope = {
  id: string;
  number: number;
  name: string;
  description: string | null;
  activities: AdminActivity[];
};

const SCOPE_ICON: Record<number, { icon: typeof Flame; gradient: string; color: string; bg: string }> = {
  1: { icon: Flame, gradient: "from-green-500 to-emerald-600", color: "text-green-700", bg: "bg-green-50" },
  2: { icon: Zap,   gradient: "from-blue-500 to-indigo-600",   color: "text-blue-700",  bg: "bg-blue-50"  },
  3: { icon: Globe, gradient: "from-amber-500 to-orange-600",  color: "text-amber-700", bg: "bg-amber-50" },
};

export function ScopesClient({ initial }: { initial: AdminScope[] }) {
  const router = useRouter();
  const [scopes, setScopes] = useState(initial);
  const [modal, setModal] = useState<
    | { mode: "create"; scopeId: string }
    | { mode: "edit"; activity: AdminActivity; scopeId: string }
    | null
  >(null);
  const [, startTransition] = useTransition();
  const { toast, showToast } = useToast();

  async function handleDelete(scopeId: string, activity: AdminActivity) {
    if (!confirm(`Delete "${activity.name}"?`)) return;
    const res = await fetch(`/api/admin/activities/${activity.id}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      showToast("err", error ?? "Failed to delete");
      return;
    }
    setScopes((prev) => prev.map((s) => s.id === scopeId ? { ...s, activities: s.activities.filter((a) => a.id !== activity.id) } : s));
    showToast("ok", "Activity deleted");
    startTransition(() => router.refresh());
  }

  async function handleToggleActive(scopeId: string, activity: AdminActivity) {
    const res = await fetch(`/api/admin/activities/${activity.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !activity.isActive }),
    });
    if (!res.ok) { showToast("err", "Failed to toggle"); return; }
    const updated = await res.json();
    setScopes((prev) => prev.map((s) => s.id === scopeId ? {
      ...s, activities: s.activities.map((a) => a.id === activity.id ? { ...a, isActive: updated.isActive } : a)
    } : s));
    showToast("ok", updated.isActive ? "Activity activated" : "Activity deactivated");
  }

  function handleSaved(scopeId: string, saved: AdminActivity, isNew: boolean) {
    setScopes((prev) => prev.map((s) => {
      if (s.id !== scopeId) return s;
      if (isNew) return { ...s, activities: [...s.activities, saved] };
      return { ...s, activities: s.activities.map((a) => a.id === saved.id ? saved : a) };
    }));
    setModal(null);
    showToast("ok", isNew ? "Activity created" : "Activity updated");
    startTransition(() => router.refresh());
  }

  const totals = {
    scopes: scopes.length,
    activities: scopes.reduce((s, sc) => s + sc.activities.length, 0),
    active: scopes.reduce((s, sc) => s + sc.activities.filter((a) => a.isActive).length, 0),
    factors: scopes.reduce((s, sc) => s + sc.activities.reduce((x, a) => x + a.factorCount, 0), 0),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scopes &amp; Activities</h1>
          <p className="mt-1 text-sm text-gray-500">The GHG Protocol taxonomy powering the Carbonly engine</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Scopes", value: totals.scopes, icon: Layers, color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Activities", value: totals.activities, icon: Flame, color: "text-green-700", bg: "bg-green-50" },
          { label: "Active", value: totals.active, icon: ToggleRight, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Emission Factors", value: totals.factors, icon: Globe, color: "text-amber-700", bg: "bg-amber-50" },
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

      {scopes.map((scope) => {
        const cfg = SCOPE_ICON[scope.number] ?? SCOPE_ICON[1];
        const Icon = cfg.icon;
        return (
          <div key={scope.id} className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-gray-50/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cfg.gradient} text-white shadow-sm`}>
                  <Icon size={16} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Scope {scope.number}: {scope.name}</h2>
                  {scope.description && <p className="text-xs text-gray-500 mt-0.5">{scope.description}</p>}
                </div>
              </div>
              <button
                onClick={() => setModal({ mode: "create", scopeId: scope.id })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Plus size={12} /> Add Activity
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/60">
                <tr>
                  {["Activity", "Unit", "Equation", "EF Count", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scope.activities.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      No activities yet. Click &quot;Add Activity&quot; to create one.
                    </td>
                  </tr>
                )}
                {scope.activities.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-gray-900">{a.name}</div>
                      {a.description && <div className="text-xs text-gray-500 mt-0.5 max-w-md truncate">{a.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{a.unit}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate font-mono">{a.equation}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{a.factorCount}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(scope.id, a)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                          a.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {a.isActive
                          ? <><ToggleRight size={11} /> Active</>
                          : <><ToggleLeft size={11} /> Inactive</>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowMenu>
                        {(close) => (
                          <>
                            <MenuItem icon={<Pencil size={12} />} onClick={() => { close(); setModal({ mode: "edit", activity: a, scopeId: scope.id }); }}>
                              Edit
                            </MenuItem>
                            <MenuItem icon={<Trash2 size={12} />} onClick={() => { close(); handleDelete(scope.id, a); }} danger>
                              Delete
                            </MenuItem>
                          </>
                        )}
                      </RowMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {modal && (
        <ActivityFormModal
          scopeId={modal.scopeId}
          activity={modal.mode === "edit" ? modal.activity : undefined}
          onClose={() => setModal(null)}
          onSaved={(a, isNew) => handleSaved(modal.scopeId, a, isNew)}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}

function ActivityFormModal({
  scopeId, activity, onClose, onSaved,
}: {
  scopeId: string;
  activity?: AdminActivity;
  onClose: () => void;
  onSaved: (a: AdminActivity, isNew: boolean) => void;
}) {
  const isEdit = !!activity;
  const [name, setName] = useState(activity?.name ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [unit, setUnit] = useState(activity?.unit ?? "");
  const [equation, setEquation] = useState(activity?.equation ?? "quantity × emissionFactor");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = isEdit ? `/api/admin/activities/${activity!.id}` : "/api/admin/activities";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scopeId, name, description, unit, equation }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      onSaved({
        id: data.id, name: data.name, description: data.description, unit: data.unit,
        equation: data.equation, isActive: data.isActive,
        sortOrder: data.sortOrder, factorCount: activity?.factorCount ?? 0,
      }, !isEdit);
    } finally { setSubmitting(false); }
  }

  return (
    <AdminModal open onClose={onClose} title={isEdit ? "Edit Activity" : "New Activity"} description={isEdit ? activity!.name : "Define a new emission source"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label required>Name</Label>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required placeholder="Stationary Combustion — Natural Gas" />
        </div>
        <div>
          <Label>Description</Label>
          <TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description of this activity" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Unit</Label>
            <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="kWh, litres, kg…" />
          </div>
          <div>
            <Label>Equation</Label>
            <TextInput value={equation} onChange={(e) => setEquation(e.target.value)} />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <FormFooter onCancel={onClose} submitLabel={isEdit ? "Save changes" : "Create activity"} submitting={submitting} />
      </form>
    </AdminModal>
  );
}
