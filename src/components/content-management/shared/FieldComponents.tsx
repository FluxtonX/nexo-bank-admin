"use client";

import { useState } from "react";
import { Trash2, Plus, GripVertical, Save, Check, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const BRAND_GRADIENT = "linear-gradient(135deg, #0A3D91 0%, #1650AB 100%)";

export type CategoryId =
  | "global"
  | "dashboard"
  | "deposit"
  | "withdraw"
  | "wallets"
  | "buysell"
  | "kyc"
  | "settings"
  | "support"
  | "landing"
  | "about"
  | "pricing"
  | "security"
  | "help";

export type ListItem = { id: string; value: string };
export type ComplexListItem = { id: string; title: string; description: string };

export function makeList(items: string[]): ListItem[] {
  return items.map((v, i) => ({ id: String(i), value: v }));
}

export function makeComplexList(items: { title: string; description: string }[]): ComplexListItem[] {
  return items.map((v, i) => ({ id: String(i), ...v }));
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
      {children}
    </p>
  );
}

export function LastUpdated({ date }: { date: string }) {
  return (
    <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
      <Clock className="h-3 w-3" />
      Last updated: {date}
    </p>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  updatedAt,
  multiline = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helper?: string;
  updatedAt?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div className="mb-1">
      <FieldLabel>{label}</FieldLabel>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none resize-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
        />
      )}
      {helper && <p className="text-[11px] text-gray-400 mt-1">{helper}</p>}
      {updatedAt && <LastUpdated date={updatedAt} />}
    </div>
  );
}

export function ListEditor({
  label,
  items,
  onChange,
  updatedAt,
}: {
  label: string;
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
  updatedAt?: string;
}) {
  const add = () =>
    onChange([...items, { id: String(Date.now()), value: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, value: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, value } : i)));

  return (
    <div className="mb-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <div className="flex-shrink-0 cursor-grab text-gray-300 hover:text-gray-400">
              <GripVertical className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 w-5 text-right shrink-0">
              {idx + 1}.
            </span>
            <input
              value={item.value}
              onChange={(e) => update(item.id, e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
            />
            <button
              onClick={() => remove(item.id)}
              className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Add item
      </button>
      {updatedAt && <LastUpdated date={updatedAt} />}
    </div>
  );
}

export function ComplexListEditor({
  label,
  items,
  onChange,
  updatedAt,
}: {
  label: string;
  items: ComplexListItem[];
  onChange: (items: ComplexListItem[]) => void;
  updatedAt?: string;
}) {
  const add = () =>
    onChange([...items, { id: String(Date.now()), title: "", description: "" }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const updateTitle = (id: string, title: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, title } : i)));
  const updateDesc = (id: string, description: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, description } : i)));

  return (
    <div className="mb-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-start gap-2 group bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex-shrink-0 cursor-grab text-gray-300 hover:text-gray-400 mt-2">
              <GripVertical className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-gray-400 w-5 text-right shrink-0 mt-2">
              {idx + 1}.
            </span>
            <div className="flex-1 space-y-2">
              <input
                value={item.title}
                onChange={(e) => updateTitle(item.id, e.target.value)}
                placeholder="Title"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
              <textarea
                value={item.description}
                onChange={(e) => updateDesc(item.id, e.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none resize-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>
            <button
              onClick={() => remove(item.id)}
              className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 mt-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        Add item
      </button>
      {updatedAt && <LastUpdated date={updatedAt} />}
    </div>
  );
}

export function SaveRow({ onSave, saved, loading }: { onSave: () => void | Promise<void>; saved: boolean; loading: boolean }) {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-100">
      <button
        onClick={onSave}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm cursor-pointer",
          saved ? "bg-emerald-500" : loading ? "opacity-75 cursor-not-allowed" : "hover:opacity-90"
        )}
        style={saved ? {} : { background: BRAND_GRADIENT }}
      >
        {loading ? (
          <>
            <Clock className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            Saved
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
}

export function ContentCard({
  title,
  icon,
  children,
  onSave,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onSave?: () => Promise<void> | void;
}) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSave = async () => {
    setError(null);
    setLoading(true);
    if (onSave) {
      try {
        await onSave();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        console.error("Save failed:", err);
        setError(err instanceof Error ? err.message : "Failed to save changes");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        {icon && <span className="text-gray-500">{icon}</span>}
        <h3 className="text-[14px] font-bold text-gray-900">{title}</h3>
      </div>
      <div className="px-5 py-5 space-y-5">
        {children}
        {error && (
          <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
        <SaveRow onSave={handleSave} saved={saved} loading={loading} />
      </div>
    </div>
  );
}

export async function updateContentKey(key: string, value: any, type: string, category: string, label: string) {
  try {
    const response = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, type, category, label }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Update failed');
    }
  } catch (error) {
    console.error('updateContentKey error:', error);
    throw error;
  }
}
