import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ensureActiveOrg } from "@/lib/org";
import { ensureCurrentUser } from "@/lib/user";
import { TransitionSchema } from "@/types/request";
import { canTransition } from "@/lib/status";
import { emitAudit } from "@/lib/audit";
import { queueOutbox } from "@/lib/outbox";

import type { Prisma } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await ensureActiveOrg();
  const user = await ensureCurrentUser();

  const body = await req.json().catch(() => null);
  const parsed = TransitionSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify(parsed.error.format()), { status: 400 });

  const r = await prisma.request.findFirst({ where: { id: id, orgId: org.id } });
  if (!r) return new Response("Not found", { status: 404 });

  const check = await canTransition(r.status, parsed.data.toStatus);
  if (!check.ok) return new Response(check.reason, { status: 403 });

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.request.update({
      where: { id: r.id },
      data: { status: parsed.data.toStatus },
    });
    await tx.requestSnapshot.create({
      data: { requestId: r.id, status: u.status, formData: (u.formData as unknown) as Prisma.InputJsonValue },
    });
    await emitAudit({
      orgId: org.id,
      requestId: r.id,
      actorId: user.id,
      type: "STATUS_CHANGED",
      data: { from: r.status, to: u.status },
    });
    await queueOutbox(tx, { orgId: org.id, requestId: r.id, type: "STATUS_CHANGED", payload: { to: u.status } });
    return u;
  });

  return Response.json({ ok: true, id: updated.id, status: updated.status });
}
