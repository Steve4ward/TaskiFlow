import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ensureActiveOrg } from "@/lib/org";
import { ensureCurrentUser } from "@/lib/user";
import { getUserRole } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";
import { queueOutbox } from "@/lib/outbox";
import { CreateRequestSchema, ListRequestsSchema } from "@/types/request";
import { RequestStatus } from "@prisma/client";

import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const org = await ensureActiveOrg();
  const role = await getUserRole();
  const user = await ensureCurrentUser();

  const parsed = ListRequestsSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return new Response(JSON.stringify(parsed.error.format()), { status: 400 });

  const { status, q, from, to, limit } = parsed.data;

  const where: Prisma.RequestWhereInput = { orgId: org.id };
  if (status) where.status = status as RequestStatus;
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (from || to) where.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };

  // Role scoping: requestors see only their own; managers/admin see all org
  if (role === "REQUESTOR") where.requesterId = user.id;

  const items = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, title: true, status: true, dueAt: true, createdAt: true, updatedAt: true,
      requester: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const org = await ensureActiveOrg();
  const user = await ensureCurrentUser();

  const body = await req.json().catch(() => null);
  const parsed = CreateRequestSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify(parsed.error.format()), { status: 400 });

  const { title, templateId, formData } = parsed.data;

  // Optional: attach SLA dueAt (naive baseline: 72h)
  const dueAt = new Date(Date.now() + 72 * 3600 * 1000);

  const created = await prisma.$transaction(async (tx) => {
    const r = await tx.request.create({
      data: {
        orgId: org.id,
        templateId: templateId ?? null,
        title,
        status: "PENDING",
        formData: formData as Prisma.InputJsonValue,
        requesterId: user.id,
        assigneeId: null,
        dueAt,
      },
    });

    await tx.requestSnapshot.create({
      data: {
        requestId: r.id,
        status: r.status,
        formData: r.formData as Prisma.InputJsonValue,
      },
    });

    await tx.auditEvent.create({
      data: {
        orgId: org.id,
        requestId: r.id,
        actorId: user.id,
        type: "REQUEST_CREATED",
        data: { title: r.title },
      },
    });

    await queueOutbox(tx, { orgId: org.id, requestId: r.id, type: "REQUEST_CREATED", payload: { title } });

    return r;
  });

  // (optional) side-channel emit
  await emitAudit({ orgId: org.id, requestId: created.id, actorId: user.id, type: "REQUEST_CREATED_DUP", data: {} });

  return Response.json({ id: created.id }, { status: 201 });
}
