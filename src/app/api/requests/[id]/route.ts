import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ensureActiveOrg } from "@/lib/org";
import { ensureCurrentUser } from "@/lib/user";
import { getUserRole } from "@/lib/auth";
import { UpdateRequestSchema } from "@/types/request";
import { getEditableKeys, redactFormData, applyPatch } from "@/lib/forms";
import { emitAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

const asJsonObject = (v: Prisma.JsonValue | null | undefined): Prisma.JsonObject =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Prisma.JsonObject) : {};

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const org = await ensureActiveOrg();
  const role = await getUserRole();
  const user = await ensureCurrentUser();

  const r = await prisma.request.findFirst({
    where: { id: params.id, orgId: org.id },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      snapshots: { orderBy: { createdAt: "desc" }, take: 5 },
      events:    { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!r) return new Response("Not found", { status: 404 });

  // Requestors can only view their own
  if (role === "REQUESTOR" && r.requesterId !== user.id) return new Response("Forbidden", { status: 403 });

  const redacted = await redactFormData({
    templateId: r.templateId,
    formData: asJsonObject(r.formData), // no any
  });

  return Response.json({
    id: r.id,
    title: r.title,
    status: r.status,
    dueAt: r.dueAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    requester: r.requester,
    assignee: r.assignee,
    formData: redacted,
    snapshots: r.snapshots.map(s => ({ id: s.id, status: s.status, createdAt: s.createdAt })),
    recentEvents: r.events.map(e => ({ id: e.id, type: e.type, createdAt: e.createdAt })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const org = await ensureActiveOrg();
  const user = await ensureCurrentUser();

  const body = await req.json().catch(() => null);
  const parsed = UpdateRequestSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify(parsed.error.format()), { status: 400 });

  const r = await prisma.request.findFirst({ where: { id: params.id, orgId: org.id } });
  if (!r) return new Response("Not found", { status: 404 });

  const allowed = await getEditableKeys({ templateId: r.templateId, formData: asJsonObject(r.formData) });
  const nextForm = applyPatch(asJsonObject(r.formData), parsed.data.formDataPatch, allowed) as unknown as Prisma.InputJsonValue;

  // Compute changed keys (for audit)
  const changed: string[] = [];
  for (const k of Object.keys(parsed.data.formDataPatch)) {
    if (allowed.has(k)) changed.push(k);
  }
  if (changed.length === 0) return Response.json({ ok: true, unchanged: true });

  const updated = await prisma.request.update({
    where: { id: r.id },
    data: { formData: nextForm },
    select: { id: true },
  });

  await emitAudit({
    orgId: org.id,
    requestId: r.id,
    actorId: user.id,
    type: "FIELD_UPDATED",
    data: { keys: changed },
  });

  return Response.json({ ok: true, id: updated.id, changed });
}
