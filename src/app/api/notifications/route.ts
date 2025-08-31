import { ensureActiveOrg } from "@/lib/org";
import { ensureCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  const org = await ensureActiveOrg();
  const user = await ensureCurrentUser();
  const items = await prisma.notification.findMany({
    where: { orgId: org.id, userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ items });
}

export async function PATCH(req: NextRequest) {
  const org = await ensureActiveOrg();
  const user = await ensureCurrentUser();
  const { ids } = await req.json().catch(() => ({ ids: [] as string[] }));
  if (!Array.isArray(ids) || !ids.length) return new Response("bad_request", { status: 400 });
  await prisma.notification.updateMany({ where: { id: { in: ids }, orgId: org.id, userId: user.id }, data: { readAt: new Date() } });
  return Response.json({ ok: true });
}
