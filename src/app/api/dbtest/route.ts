// import { auth } from "@/lib/auth";
// import { prisma } from "@/lib/db";

// export async function GET() {
//   const { orgId } = await auth();
//   if (!orgId) return new Response("No active organization", { status: 403 });

//   const [orgs, requests] = await Promise.all([
//     prisma.organization.count(),
//     prisma.request.count({ where: { orgId } }),
//   ]);

//   return Response.json({ ok: true, orgs, requestsForActiveOrg: requests });
// }

import { ensureActiveOrg } from "@/lib/org";
import { prisma } from "@/lib/db";

export async function GET() {
  const org = await ensureActiveOrg();
  const [orgs, requests] = await Promise.all([
    prisma.organization.count(),
    prisma.request.count({ where: { orgId: org.id } }),
  ]);
  return Response.json({ ok: true, orgs, activeOrg: { id: org.id, name: org.name }, requestsForActiveOrg: requests });
}
