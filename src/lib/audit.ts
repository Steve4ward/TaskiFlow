import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Json = Prisma.InputJsonValue;
const asJson = (v: unknown): Json => v as Json;

export async function emitAudit(args: {
  orgId: string;
  requestId: string;
  actorId?: string | null;
  type: string;
  data?: Record<string, unknown>;
}) {
  const { orgId, requestId, actorId, type, data } = args;
  await prisma.auditEvent.create({
    data: { orgId, requestId, actorId: actorId ?? null, type, data: asJson(data ?? {}) },
  });
}