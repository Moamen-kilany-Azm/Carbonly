"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Star, Search, SlidersHorizontal } from "lucide-react";
import {
  AdminModal, Label, TextInput, Select, FormFooter,
  RowMenu, MenuItem, useToast, Toast,
} from "@/components/admin/admin-ui";

export type AdminFactor = {
  id: string;
  activityId: string;
  activityName: string;
  scopeNumber: number;
  name: string;
  value: number;
  unit: string;
  source: string | null;
  region: string | null;
  gwp: string | null;
  isDefault: boolean;
};

export type ActivityOption = { id: string; name: string; scopeNumber: number; unit: string };

const SCOPE_COLOR: Record<number, string> = {
  1: "bg-green-100 text-green-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-amber-100 text-amber-700",
};

export function FactorsClient({
  initial, activities,
}: {
  initial: AdminFactor[];
  activities: ActivityOption[];
}) {
  const router = useRouter();
  const [factors, setFactors] = useState(initial);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [modal, setModal] = useState<{ mode: "create" | "edit"; factor?: AdminFactor } | null>(null);
  const [, startTransition] = useTransition();
  const { toast, showToast } = useToast();

  const filtered = useMemo(() => {
    return factors.filter((f) => {
      if (scopeFilter !== "all" && String(f.scopeNumber) !== scopeFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) ||
             f.activityName.toLowerCase().includes(q) ||
             (f.source ?? "").toLowerCase().includes(q);
    });
  }, [factors, search, scopeFilter]);

  async function handleDelete(factor: AdminFactor) {
    if (!confirm(`Delete "${factor.name}"?`)) return;
    const res = await fetch(`/api/admin/emission-factors/${factor.id}`, { method: "DELETE" });
    if (!res.ok) {
      const { error } = await res.json();
      showToast("err", error ?? "Failed to delete");
      return;
    }
    setFactors((prev) => prev.filter((f) => f.id !== factor.id));
    showToast("ok", "Factor deleted");
    startTransition(() => router.refresh());
  }

  async function handleToggleDefault(factor: AdminFactor) {
    const res = await fetch(`/api/admin/emission-factors/${factor.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: !factor.isDefault }),
    });
    if (!res.ok) { showToast("err", "Failed to toggle default"); return; }
    // Un-default others in same activity, set this one
    setFactors((prev) => prev.map((f) => {
      if (f.id === factor.id) return { ...f, isDefault: !factor.isDefault };
      if (!factor.isDefault && f.activityId === factor.activityId) return { ...f, isDefault: false };
      return f;
    }));
    showToast("ok", factor.isDefault ? "Removed as default" : "Set as default");
    startTransition(() => router.refresh());
  }

  function handleSaved(saved: AdminFactor, isNew: boolean) {
    if (isNew) {
      // Un-default others if this one is default
      setFactors((prev) => {
        let next = prev;
        if (saved.isDefault) next = prev.map((f) => f.activityId === saved.activityId ? { ...f, isDefault: false } : f);
        return [saved, ...next];
      });
    } else {
      setFactors((prev) => prev.map((f) => {
        if (f.id === saved.id) return saved;
        if (saved.isDefault && f.activityId === saved.activityId) return { ...f, isDefault: false };
        return f;
      }));
    }
    setModal(null);
    showToast("ok", isNew ? "Factor created" : "Factor updated");
    startTransition(() => router.refresh());
  }

  const counts = {
    total: factors.length,
    defaults: factors.filter((f) => f.isDefault).length,
    s1: factors.filter((f) => f.scopeNumber === 1).length,
    s2: factors.filter((f) => f.scopeNumber === 2).length,
    s3: factors.filter((f) => f.scopeNumber === 3).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emission Factors</h1>
          <p className="mt-1 text-sm text-gray-500">Master library of emission factors used in all calculations</p>
        </div>
        <button
          onClick={() => setModal({ mode: "create" })}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          <Plus size={15} /> New Factor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: counts.total, className: "bg-gray-50 text-gray-900" },
          { label: "Defaults", value: counts.defaults, className: "bg-green-50 text-green-700" },
          { label: "Scope 1", value: counts.s1, className: "bg-green-50 text-green-700" },
          { label: "Scope 2", value: counts.s2, className: "bg-blue-50 text-blue-700" },
          { label: "Scope 3", value: counts.s3, className: "bg-amber-50 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.className}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search factor name, activity or source…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
        >
          <option value="all">All scopes</option>
          <option value="1">Scope 1</option>
          <option value="2">Scope 2</option>
          <option value="3">Scope 3</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Scope", "Activity", "Factor", "Value", "Unit", "Source", "Region", "Default", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${SCOPE_COLOR[f.scopeNumber] ?? "bg-gray-100 text-gray-600"}`}>
                    S{f.scopeNumber}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800 max-w-[180px] truncate">{f.activityName}</td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate">{f.name}</td>
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900">{f.value}</td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{f.unit}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{f.source ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{f.region ?? "—"}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleDefault(f)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                      f.isDefault
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                    title={f.isDefault ? "Currently default" : "Set as default"}
                  >
                    <Star size={10} className={f.isDefault ? "fill-green-700" : ""} />
                    {f.isDefault ? "Default" : "Set default"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <RowMenu>
                    {(close) => (
                      <>
                        <MenuItem icon={<Pencil size={12} />} onClick={() => { close(); setModal({ mode: "edit", factor: f }); }}>
                          Edit
                        </MenuItem>
                        <MenuItem icon={<Trash2 size={12} />} onClick={() => { close(); handleDelete(f); }} danger>
                          Delete
                        </MenuItem>
                      </>
                    )}
                  </RowMenu>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <SlidersHorizontal size={20} className="text-gray-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {search || scopeFilter !== "all" ? "No factors match your filters" : "No emission factors yet"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <FactorFormModal
          factor={modal.factor}
          activities={activities}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}

function FactorFormModal({
  factor, activities, onClose, onSaved,
}: {
  factor?: AdminFactor;
  activities: ActivityOption[];
  onClose: () => void;
  onSaved: (f: AdminFactor, isNew: boolean) => void;
}) {
  const isEdit = !!factor;
  const [activityId, setActivityId] = useState(factor?.activityId ?? activities[0]?.id ?? "");
  const [name, setName] = useState(factor?.name ?? "");
  const [value, setValue] = useState<string>(factor?.value.toString() ?? "");
  const [unit, setUnit] = useState(factor?.unit ?? "");
  const [source, setSource] = useState(factor?.source ?? "");
  const [region, setRegion] = useState(factor?.region ?? "");
  const [gwp, setGwp] = useState(factor?.gwp ?? "");
  const [isDefault, setIsDefault] = useState(factor?.isDefault ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const numValue = parseFloat(value);
    if (isNaN(numValue)) { setError("Value must be a number"); setSubmitting(false); return; }
    try {
      const url = isEdit ? `/api/admin/emission-factors/${factor!.id}` : "/api/admin/emission-factors";
      const body = isEdit
        ? { name, value: numValue, unit, source, region, gwp, isDefault }
        : { activityId, name, value: numValue, unit, source, region, gwp, isDefault };
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      const act = activities.find((a) => a.id === (isEdit ? factor!.activityId : activityId));
      onSaved({
        id: data.id, activityId: data.activityId,
        activityName: act?.name ?? factor?.activityName ?? "",
        scopeNumber: act?.scopeNumber ?? factor?.scopeNumber ?? 1,
        name: data.name, value: data.value, unit: data.unit,
        source: data.source, region: data.region, gwp: data.gwp,
        isDefault: data.isDefault,
      }, !isEdit);
    } finally { setSubmitting(false); }
  }

  return (
    <AdminModal open onClose={onClose} title={isEdit ? "Edit Emission Factor" : "New Emission Factor"} description={isEdit ? factor!.name : "Add a new factor to the master library"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div>
            <Label required>Activity</Label>
            <Select value={activityId} onChange={(e) => setActivityId(e.target.value)} required>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>Scope {a.scopeNumber} — {a.name} ({a.unit})</option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label required>Factor Name</Label>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required placeholder="UK DEFRA 2024" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Value (kgCO₂e per unit)</Label>
            <TextInput type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} required placeholder="0.20493" />
          </div>
          <div>
            <Label required>Unit</Label>
            <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="kgCO2e/kWh" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Source</Label>
            <TextInput value={source} onChange={(e) => setSource(e.target.value)} placeholder="DEFRA, EPA, IPCC AR5…" />
          </div>
          <div>
            <Label>Region</Label>
            <TextInput value={region} onChange={(e) => setRegion(e.target.value)} placeholder="UK, US, EU…" />
          </div>
        </div>

        <div>
          <Label>GWP Reference</Label>
          <TextInput value={gwp} onChange={(e) => setGwp(e.target.value)} placeholder="IPCC AR5 100-year" />
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700">
            <span className="font-semibold">Set as default</span> — this factor will be pre-selected in the calculator for its activity
          </span>
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <FormFooter onCancel={onClose} submitLabel={isEdit ? "Save changes" : "Create factor"} submitting={submitting} />
      </form>
    </AdminModal>
  );
}
