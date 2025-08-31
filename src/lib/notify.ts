import { prisma } from "@/lib/db";
export async function notify(userId: string, orgId: string, title: string, body = "") {
  await prisma.notification.create({ data: { userId, orgId, title, body } });
}
export async function markRead(ids: string[], userId: string) {
  await prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { readAt: new Date() } });
}
