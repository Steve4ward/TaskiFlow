import { auth, currentUser } from "@clerk/nextjs/server";

export type AppRole = "REQUESTOR" | "MANAGER" | "ADMIN";
const RANK: Record<AppRole, number> = { REQUESTOR: 0, MANAGER: 1, ADMIN: 2 };

export async function getAuthContext() {
  const { userId, orgId, orgRole } = await auth(); // orgRole like "org:admin" | "org:member"
  return { userId, orgId, orgRole };
}

export function mapRole(orgRole: string | null | undefined, userPublicRole?: string): AppRole {
  if (userPublicRole === "ADMIN" || userPublicRole === "MANAGER" || userPublicRole === "REQUESTOR")
    return userPublicRole as AppRole;
  if (orgRole === "org:admin") return "ADMIN";
  return "MANAGER"; // default; refine later with per-user metadata
}

export async function getUserRole(): Promise<AppRole> {
  const { orgRole } = await getAuthContext();
  const user = await currentUser();
  const publicRole = (user?.publicMetadata?.role as string | undefined) ?? undefined;
  return mapRole(orgRole, publicRole);
}

export async function requireOrg() {
  const { orgId } = await getAuthContext();
  if (!orgId) throw new Response("No active organization", { status: 403 });
  return orgId;
}

export async function requireRole(min: AppRole) {
  const role = await getUserRole();
  if (RANK[role] < RANK[min]) throw new Response("Forbidden", { status: 403 });
  return role;
}

export { auth } from "@clerk/nextjs/server";