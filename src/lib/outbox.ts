import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

export async function queueOutbox(tx: Tx, e: {
  orgId: string;
  requestId: string;
  type: string;
  payload?: Prisma.InputJsonValue;
}) {
  await tx.requestEventOutbox.create({
    data: { orgId: e.orgId, requestId: e.requestId, type: e.type, payload: (e.payload ?? {})},
  });
}
