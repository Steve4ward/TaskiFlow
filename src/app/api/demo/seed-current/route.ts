// app/api/demo/seed-current/route.ts
import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { Role, RequestStatus, Prisma } from "@prisma/client";

function hoursFromNow(h: number) { return new Date(Date.now() + h * 3600 * 1000); }

export async function POST(_req: NextRequest) {
  const { userId, orgId } = await auth(); // ⬅️ await
  if (!userId) return new Response("Unauthenticated", { status: 401 });
  if (!orgId) return new Response("Select or create an organization first", { status: 400 });

  // We don't need Clerk org name; use a sensible fallback
  await prisma.organization.upsert({
    where: { id: orgId },
    update: { name: "TaskiFlow Demo" },
    create: { id: orgId, name: "TaskiFlow Demo" },
  });

  // Ensure current user exists & is MANAGER in this org
  const me = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId, email: `${userId}@example.local`, name: "Demo Manager" },
  });
  await prisma.membership.upsert({
    where: { userId_orgId: { userId: me.id, orgId } },
    update: { role: Role.MANAGER },
    create: { userId: me.id, orgId, role: Role.MANAGER },
  });

  // Demo requestors (DB-only)
  const req1 = await prisma.user.upsert({
    where: { clerkId: "demo-req-1" },
    update: { email: "alice@taskiflow.demo", name: "Alice Requestor" },
    create: { clerkId: "demo-req-1", email: "alice@taskiflow.demo", name: "Alice Requestor" },
  });
  const req2 = await prisma.user.upsert({
    where: { clerkId: "demo-req-2" },
    update: { email: "bob@taskiflow.demo", name: "Bob Requestor" },
    create: { clerkId: "demo-req-2", email: "bob@taskiflow.demo", name: "Bob Requestor" },
  });

  await prisma.membership.createMany({
    data: [
      { orgId, userId: req1.id, role: Role.REQUESTOR },
      { orgId, userId: req2.id, role: Role.REQUESTOR },
    ],
    skipDuplicates: true,
  });

  // Template + sample requests
  const tplId = `${orgId}-demo-template`;
  const tpl = await prisma.formTemplate.upsert({
    where: { id: tplId },
    update: {},
    create: {
      id: tplId, orgId, name: "Telco Service Request", slaHours: 72,
      schema: {
        fields: [
          { key: "customer_name", label: "Customer Name", type: "text", required: true,
            visibleForRoles: ["REQUESTOR","MANAGER","ADMIN"], editableForRoles: ["REQUESTOR","MANAGER","ADMIN"] },
          { key: "priority", label: "Priority", type: "select", options: ["P1","P2","P3"], required: true,
            visibleForRoles: ["REQUESTOR","MANAGER","ADMIN"], editableForRoles: ["REQUESTOR","MANAGER","ADMIN"] },
          { key: "budget", label: "Estimated Budget (€)", type: "number",
            visibleForRoles: ["MANAGER","ADMIN"], editableForRoles: ["MANAGER","ADMIN"] },
          { key: "risk_level", label: "Risk Level (1-5)", type: "number",
            visibleForRoles: ["MANAGER","ADMIN"], editableForRoles: ["MANAGER","ADMIN"] },
          { key: "risk_notes", label: "Risk Notes", type: "textarea",
            visibleForRoles: ["MANAGER","ADMIN"], editableForRoles: ["MANAGER","ADMIN"],
            showIf: [{ field: "risk_level", op: ">=", value: 3 }] }
        ]
      },
      version: 1, isActive: true,
    },
  });

  // Seed requests
  await prisma.$transaction(async (tx) => {
    const rows = [
      { title: "Fiber link for Warehouse A", status: RequestStatus.IN_REVIEW,
        formData: { customer_name: "ACME Logistics", priority: "P1", risk_level: 2 },
        requesterId: req1.id, assigneeId: me.id, dueAt: hoursFromNow(12) },
      { title: "SIP Trunks Upgrade", status: RequestStatus.PENDING,
        formData: { customer_name: "BlueOcean Shipping", priority: "P2" },
        requesterId: req2.id, assigneeId: null, dueAt: hoursFromNow(60) },
      { title: "MPLS Migration", status: RequestStatus.IN_PROGRESS,
        formData: { customer_name: "Helios Maritime", priority: "P1", risk_level: 4, risk_notes: "Legacy hardware" },
        requesterId: req1.id, assigneeId: me.id, dueAt: hoursFromNow(-6) },
      { title: "QoS Tuning", status: RequestStatus.DONE,
        formData: { customer_name: "Delta Freight", priority: "P3" },
        requesterId: req2.id, assigneeId: me.id, dueAt: hoursFromNow(-48) },
      { title: "New Branch Circuit", status: RequestStatus.APPROVED,
        formData: { customer_name: "Seawise Ltd", priority: "P2" },
        requesterId: req2.id, assigneeId: me.id, dueAt: hoursFromNow(72) },
      { title: "VPN Access for Contractors", status: RequestStatus.REJECTED,
        formData: { customer_name: "PortServe", priority: "P3" },
        requesterId: req1.id, assigneeId: null, dueAt: hoursFromNow(-12) },
    ];
    for (const r of rows) {
      const rec = await tx.request.create({
        data: { orgId, templateId: tpl.id, title: r.title, status: r.status,
                formData: r.formData as Prisma.InputJsonValue, requesterId: r.requesterId,
                assigneeId: r.assigneeId, dueAt: r.dueAt },
      });
      await tx.requestSnapshot.create({ data: { requestId: rec.id, status: rec.status, formData: rec.formData as Prisma.InputJsonValue } });
      await tx.auditEvent.createMany({
        data: [
          { orgId, requestId: rec.id, actorId: rec.requesterId, type: "REQUEST_CREATED", data: { title: rec.title } },
          { orgId, requestId: rec.id, actorId: rec.assigneeId, type: "STATUS_CONFIRMED", data: { status: rec.status } },
        ],
      });
    }
  });

  return Response.redirect(new URL("/dashboard", _req.url), 303);
}
