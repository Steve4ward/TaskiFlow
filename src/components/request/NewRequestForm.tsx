"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { TemplateSchema, Field, ShowIf } from "@/types/form";
import { z } from "zod";

const titleSchema = z.object({ title: z.string().min(3, "Title must be at least 3 characters") });

function evalShowIf(conds: ShowIf[] | undefined, values: Record<string, unknown>): boolean {
  if (!conds || conds.length === 0) return true;
  return conds.every((c) => {
    const left = values[c.field] as unknown;
    const right = c.value as unknown;
    const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v));
    switch (c.op) {
      case "==": return left === right;
      case "!=": return left !== right;
      case ">":  return toNum(left) >  toNum(right);
      case ">=": return toNum(left) >= toNum(right);
      case "<":  return toNum(left) <  toNum(right);
      case "<=": return toNum(left) <= toNum(right);
      default:   return false;
    }
  });
}

function visibleForRequestor(f: Field): boolean {
  // MVP: render if not restricted or includes REQUESTOR
  return !f.visibleForRoles || f.visibleForRoles.includes("REQUESTOR");
}

export default function NewRequestForm({
  templateId,
  schema,
}: { templateId: string | null; schema: TemplateSchema }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  const renderable = useMemo(() => {
    const fields = schema.fields ?? [];
    return fields.filter((f) => visibleForRequestor(f) && evalShowIf(f.showIf, values));
  }, [schema.fields, values]);

  const setVal = (key: string, v: unknown) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = titleSchema.safeParse({ title });
    if (!parsed.success) {
      const f = parsed.error.flatten();
      setError(f.fieldErrors.title?.[0] ?? f.formErrors[0] ?? "Invalid title");
      return;
    }

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: parsed.data.title,
        templateId: templateId ?? undefined,
        formData: values,
      }),
    });

    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const json = (await res.json()) as { id: string };
    router.push(`/requests/${json.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Fiber link for warehouse A"
          required
        />
      </div>

      <div className="space-y-4">
        {renderable.map((f) => (
          <FieldInput key={f.key} field={f} values={values} setVal={setVal} />
        ))}
        {renderable.length === 0 && (
          <div className="text-sm opacity-70">No additional fields for your role.</div>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        className="rounded border px-4 py-2 text-sm font-medium hover:bg-black/5"
      >
        Create Request
      </button>
    </form>
  );
}

function FieldInput({
  field,
  values,
  setVal,
}: {
  field: Field;
  values: Record<string, unknown>;
  setVal: (k: string, v: unknown) => void;
}) {
  const common = (
    <label className="mb-1 block text-sm font-medium">
      {field.label ?? field.key}
      {field.required ? " *" : ""}
    </label>
  );

  const val = values[field.key];

  switch (field.type) {
    case "number":
      return (
        <div>
          {common}
          <input
            type="number"
            className="w-full rounded border px-3 py-2 text-sm"
            value={val as number | undefined ?? ""}
            onChange={(e) => setVal(field.key, e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </div>
      );
    case "select":
      return (
        <div>
          {common}
          <select
            className="w-full rounded border px-3 py-2 text-sm"
            value={(val as string | undefined) ?? ""}
            onChange={(e) => setVal(field.key, e.target.value || undefined)}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((op, i) => (
              <option key={i} value={String(op)}>{String(op)}</option>
            ))}
          </select>
        </div>
      );
    case "textarea":
      return (
        <div>
          {common}
          <textarea
            className="w-full rounded border px-3 py-2 text-sm"
            value={(val as string | undefined) ?? ""}
            onChange={(e) => setVal(field.key, e.target.value || undefined)}
            rows={4}
          />
        </div>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            id={field.key}
            type="checkbox"
            className="h-4 w-4"
            checked={Boolean(val)}
            onChange={(e) => setVal(field.key, e.target.checked)}
          />
          <label htmlFor={field.key} className="text-sm">{field.label ?? field.key}</label>
        </div>
      );
    case "date":
      return (
        <div>
          {common}
          <input
            type="date"
            className="w-full rounded border px-3 py-2 text-sm"
            value={(val as string | undefined) ?? ""}
            onChange={(e) => setVal(field.key, e.target.value || undefined)}
          />
        </div>
      );
    default:
      return (
        <div>
          {common}
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            value={(val as string | undefined) ?? ""}
            onChange={(e) => setVal(field.key, e.target.value || undefined)}
            placeholder={field.label}
          />
        </div>
      );
  }
}
