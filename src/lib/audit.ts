import { prisma } from "@/lib/db";

export async function emitAudit(args: {
  orgId: string;
  requestId: string;
  actorId?: string | null;
  type: string;
  data?: Record<string, unknown>;
}) {
  const { orgId, requestId, actorId, type, data } = args;
  await prisma.auditEvent.create({
    data: { orgId, requestId, actorId: actorId ?? null, type, data: (data ?? {}) as any },
  });
}
