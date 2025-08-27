import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getUserRole } from "@/lib/auth";
import { TemplateSchema, ShowIf } from "@/types/form";

function evaluateShowIf(showIf: ShowIf[] | undefined, data: Record<string, unknown>): boolean {
  if (!showIf || showIf.length === 0) return true;
  return showIf.every((c) => {
    const left = data[c.field] as unknown;
    const right = c.value as unknown;
    switch (c.op) {
      case "==": return left == right;
      case "!=": return left != right;
      case ">":  return Number(left) > Number(right);
      case ">=": return Number(left) >= Number(right);
      case "<":  return Number(left) < Number(right);
      case "<=": return Number(left) <= Number(right);
      default: return false;
    }
  });
}

export async function loadTemplate(templateId?: string | null) {
  if (!templateId) return null;
  const t = await prisma.formTemplate.findUnique({ where: { id: templateId } });
  return (t?.schema as TemplateSchema) ?? null;
}

export async function getEditableKeys(opts: {
  templateId?: string | null;
  formData: Record<string, unknown>;
}): Promise<Set<string>> {
  const role = await getUserRole();
  const schema = await loadTemplate(opts.templateId);
  const set = new Set<string>();
  const fields = schema?.fields ?? [];
  for (const f of fields) {
    const visible = (f.visibleForRoles ?? ["REQUESTOR","MANAGER","ADMIN"]).includes(role);
    const editable = (f.editableForRoles ?? ["REQUESTOR","MANAGER","ADMIN"]).includes(role);
    if (visible && editable && evaluateShowIf(f.showIf, opts.formData)) {
      set.add(f.key);
    }
  }
  return set;
}

export async function redactFormData(opts: {
  templateId?: string | null;
  formData: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const role = await getUserRole();
  const schema = await loadTemplate(opts.templateId);
  const out: Record<string, unknown> = {};
  const fields = schema?.fields ?? [];
  for (const f of fields) {
    const visible = (f.visibleForRoles ?? ["REQUESTOR","MANAGER","ADMIN"]).includes(role);
    if (visible && evaluateShowIf(f.showIf, opts.formData) && f.key in opts.formData) {
      out[f.key] = opts.formData[f.key];
    }
  }
  // If no schema fields defined, return as-is for managers/admin, own-only for requestor
  if (fields.length === 0) {
    if (role === "REQUESTOR") return opts.formData;
    return opts.formData;
  }
  return out;
}

export function applyPatch(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
  allowed: Set<string>
) {
  const next = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (allowed.has(k)) next[k] = v;
  }
  return next as Prisma.InputJsonValue;
}
