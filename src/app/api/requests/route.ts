import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureActiveOrg } from "@/lib/org";
import { ensureCurrentUser } from "@/lib/user";
import { getUserRole } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";
import { queueOutbox } from "@/lib/outbox";
import { CreateRequestSchema, ListRequestsSchema } from "@/types/request";
import { RequestStatus, Prisma } from "@prisma/client";
import { calcDueAt } from "@/lib/sla";
import { notify } from "@/lib/notify";

import { RequestsListResponseDTO, CreateRequestResponseDTO } from "@/lib/dto/request";
import { mapList } from "@/lib/dto/map";
import { applyListCacheHeaders } from "@/lib/http/cache";

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
  if (role === "REQUESTOR") where.requesterId = user.id;

  const rows = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, orgId: true, title: true, status: true, dueAt: true, createdAt: true, updatedAt: true,
      requester: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  const payload = mapList(rows);
  const validated = RequestsListResponseDTO.parse(payload);

  const res = NextResponse.json(validated);
  return applyListCacheHeaders(res);
}

export async function POST(req: NextRequest) {
  const org = await ensureActiveOrg();
  const user = await ensureCurrentUser();

  const body = await req.json().catch(() => null);
  const parsed = CreateRequestSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify(parsed.error.format()), { status: 400 });

  const { title, templateId, formData } = parsed.data;

  const tpl = parsed.data.templateId
    ? await prisma.formTemplate.findUnique({ where: { id: parsed.data.templateId }, select: { slaHours: true } })
    : null;
  const dueAt = calcDueAt({ slaHours: tpl?.slaHours ?? 72 });

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
    await notify(user.id, org.id, "Request created", `“${title}” was created.`);

    return r;
  });

  // (optional) side-channel emit
  await emitAudit({ orgId: org.id, requestId: created.id, actorId: user.id, type: "REQUEST_CREATED_DUP", data: {} });
  
  const payload = { id: created.id };
  const validated = CreateRequestResponseDTO.parse(payload);
  return NextResponse.json(validated, { status: 201 });
}
