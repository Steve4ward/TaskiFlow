import { RequestStatus, Role } from "@prisma/client";
import { prisma } from "../src/lib/db";
import type { Prisma } from "@prisma/client";

async function main() {
  // Demo org
  const org = await prisma.organization.create({
    data: { name: "Demo Org" },
  });

  // Demo users (placeholder clerkIds; map later to real users)
  const [admin, manager, req1, req2] = await Promise.all([
    prisma.user.create({ data: { clerkId: "demo-admin", email: "admin@example.com", name: "Admin User" } }),
    prisma.user.create({ data: { clerkId: "demo-manager", email: "manager@example.com", name: "Manager User" } }),
    prisma.user.create({ data: { clerkId: "demo-req1", email: "alice@example.com", name: "Alice Requestor" } }),
    prisma.user.create({ data: { clerkId: "demo-req2", email: "bob@example.com", name: "Bob Requestor" } }),
  ]);

  await prisma.membership.createMany({
    data: [
      { orgId: org.id, userId: admin.id, role: Role.ADMIN },
      { orgId: org.id, userId: manager.id, role: Role.MANAGER },
      { orgId: org.id, userId: req1.id, role: Role.REQUESTOR },
      { orgId: org.id, userId: req2.id, role: Role.REQUESTOR },
    ],
  });

  // Template with basic visibility rules
  const template = await prisma.formTemplate.create({
    data: {
      orgId: org.id,
      name: "Telco Service Request",
      schema: {
        fields: [
          { key: "customer_name", label: "Customer Name", type: "text", required: true,
            visibleForRoles: ["REQUESTOR","MANAGER","ADMIN"], editableForRoles: ["REQUESTOR","MANAGER","ADMIN"] },
          { key: "priority", label: "Priority", type: "select", required: true,
            options: ["P1","P2","P3"], visibleForRoles: ["REQUESTOR","MANAGER","ADMIN"], editableForRoles: ["REQUESTOR","MANAGER","ADMIN"] },
          { key: "budget", label: "Estimated Budget (€)", type: "number", required: false,
            visibleForRoles: ["MANAGER","ADMIN"], editableForRoles: ["MANAGER","ADMIN"] },
          { key: "risk_level", label: "Risk Level", type: "number", required: false,
            visibleForRoles: ["MANAGER","ADMIN"], editableForRoles: ["MANAGER","ADMIN"] },
          { key: "risk_notes", label: "Risk Notes", type: "textarea", required: false,
            visibleForRoles: ["MANAGER","ADMIN"], editableForRoles: ["MANAGER","ADMIN"],
            showIf: [{ field: "risk_level", op: ">=", value: 3 }] }
        ]
      },
      version: 1,
    },
  });

  const addHours = (d: Date, h: number) => new Date(d.getTime() + h * 3600_000);

  // Sample requests
  const r1 = await prisma.request.create({
    data: {
      orgId: org.id,
      templateId: template.id,
      title: "Fiber link for warehouse A",
      status: RequestStatus.IN_REVIEW,
      formData: { customer_name: "ACME Logistics", priority: "P1" },
      requesterId: req1.id,
      assigneeId: manager.id,
      dueAt: template.slaHours ? addHours(new Date(), template.slaHours) : null,
    },
  });

  const r2 = await prisma.request.create({
    data: {
      orgId: org.id,
      templateId: template.id,
      title: "SIP trunks upgrade",
      status: RequestStatus.PENDING,
      formData: { customer_name: "BlueOcean Shipping", priority: "P2" },
      requesterId: req2.id,
      dueAt: template.slaHours ? addHours(new Date(), template.slaHours) : null,
    },
  });

  // Snapshots + audit
  await prisma.requestSnapshot.createMany({
    data: [
      { requestId: r1.id, status: r1.status, formData: r1.formData as Prisma.InputJsonValue },
      { requestId: r2.id, status: r2.status, formData: r1.formData as Prisma.InputJsonValue },
    ],
  });

  await prisma.auditEvent.createMany({
    data: [
      { orgId: org.id, requestId: r1.id, actorId: req1.id, type: "REQUEST_CREATED", data: { title: r1.title } },
      { orgId: org.id, requestId: r1.id, actorId: manager.id, type: "STATUS_CHANGED", data: { to: "IN_REVIEW" } },
      { orgId: org.id, requestId: r2.id, actorId: req2.id, type: "REQUEST_CREATED", data: { title: r2.title } },
    ],
  });

  console.log("Seed complete:", { org: org.name, users: 4, requests: 2 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});