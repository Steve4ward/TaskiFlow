import { prisma } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function ensureCurrentUser() {
  const cu = await currentUser();
  if (!cu) throw new Response("Unauthenticated", { status: 401 });
  const email = cu.emailAddresses?.[0]?.emailAddress ?? `${cu.id}@example.local`;
  let user = await prisma.user.findUnique({ where: { clerkId: cu.id } });
  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: cu.id, email, name: cu.firstName ? `${cu.firstName} ${cu.lastName ?? ""}`.trim() : cu.username ?? email },
    });
  }
  return user;
}
