import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const authz = req.headers.get("authorization");
  if (!authz || authz !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });

  const batch = await prisma.requestEventOutbox.findMany({
    where: { processedAt: null },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  if (!batch.length) return Response.json({ ok: true, processed: 0 });

  const now = new Date();
  await prisma.requestEventOutbox.updateMany({
    where: { id: { in: batch.map(b => b.id) } },
    data: { processedAt: now },
  });

  return Response.json({ ok: true, processed: batch.length });
}
