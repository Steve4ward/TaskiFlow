import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, orgId, orgRole } = await auth();
  return Response.json({ ok: true, userId, orgId, orgRole });
}