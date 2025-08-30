import { prisma } from "@/lib/db";
import { ensureActiveOrg } from "@/lib/org";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const org = await ensureActiveOrg();
  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since")
    ? new Date(searchParams.get("since")!)
    : new Date(Date.now() - 60_000);

  const now = new Date();
  await prisma.requestEventOutbox.updateMany({
    where: { orgId: org.id, processedAt: null },
    data: { processedAt: now },
  });

  const items = await prisma.requestEventOutbox.findMany({
    where: { orgId: org.id, processedAt: { gt: since } },
    orderBy: { processedAt: "asc" },
    take: 500,
  });

  const nextCursor = items.length
    ? items[items.length - 1]!.processedAt!.toISOString()
    : since.toISOString();

  return Response.json({
    items: items.map(e => ({
      id: e.id, orgId: e.orgId, requestId: e.requestId,
      type: e.type, payload: e.payload,
      createdAt: e.createdAt, processedAt: e.processedAt,
    })),
    nextCursor,
  });
}
