import { prisma } from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function ensureActiveOrg() {
  const { orgId, orgSlug } = await auth();
  if (!orgId) throw new Response("No active organization", { status: 403 });

  // If already present in our DB, return it
  const found = await prisma.organization.findUnique({ where: { id: orgId } });
  if (found) return found;

  // Fetch name from Clerk (clerkClient is a function → call it)
  try {
    const clerk = await clerkClient(); // 👈 important
    const org = await clerk.organizations.getOrganization({ organizationId: orgId });
    return prisma.organization.create({ data: { id: orgId, name: org.name } });
  } catch {
    // Fallback: use slug or a readable default
    const name = orgSlug ?? `Org ${orgId.slice(-6)}`;
    return prisma.organization.create({ data: { id: orgId, name } });
  }
}