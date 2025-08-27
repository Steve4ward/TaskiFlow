import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) return new Response("No active organization", { status: 403 });

  const [orgs, requests] = await Promise.all([
    prisma.organization.count(),
    prisma.request.count({ where: { orgId } }),
  ]);

  return Response.json({ ok: true, orgs, requestsForActiveOrg: requests });
}
