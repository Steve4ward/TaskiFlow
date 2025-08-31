import { Prisma, PrismaClient, RequestStatus, Role } from "@prisma/client";
const prisma = new PrismaClient();

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600 * 1000);
}

async function upsertUser(clerkId: string, email: string, name: string) {
  return prisma.user.upsert({
    where: { clerkId },
    update: { email, name },
    create: { clerkId, email, name },
  });
}

async function main() {
  // 1) Org
  const org = await prisma.organization.upsert({
    where: { id: "demo-org" },
    update: { name: "TaskiFlow Demo" },
    create: { id: "demo-org", name: "TaskiFlow Demo" },
  });

  // 2) Users (placeholder Clerk IDs; when using real Clerk users later,
  // map them by setting their clerkId to these or use the /api/demo/attach route below)
  const admin    = await upsertUser("demo-admin",    "admin@taskiflow.demo",    "Demo Admin");
  const manager  = await upsertUser("demo-manager",  "manager@taskiflow.demo",  "Demo Manager");
  const request1 = await upsertUser("demo-req-1",    "alice@taskiflow.demo",    "Alice Requestor");
  const request2 = await upsertUser("demo-req-2",    "bob@taskiflow.demo",      "Bob Requestor");

  // 3) Memberships
  await prisma.membership.createMany({
    data: [
      { orgId: org.id, userId: admin.id,   role: Role.ADMIN },
      { orgId: org.id, userId: manager.id, role: Role.MANAGER },
      { orgId: org.id, userId: request1.id, role: Role.REQUESTOR },
      { orgId: org.id, userId: request2.id, role: Role.REQUESTOR },
    ],
    skipDuplicates: true,
  });

  // 4) Template (with SLA)
  const tpl = await prisma.formTemplate.upsert({
    where: { id: "demo-template" },
    update: {},
    create: {
      id: "demo-template",
      orgId: org.id,
      name: "Telco Service Request",
      slaHours: 72,
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
      version: 1,
      isActive: true,
    },
  });

  // 5) Requests across statuses (including overdue & due soon)
  const rows = [
    {
      title: "Fiber link for Warehouse A",
      status: RequestStatus.IN_REVIEW,
      formData: { customer_name: "ACME Logistics", priority: "P1", risk_level: 2 },
      requesterId: request1.id, assigneeId: manager.id,
      dueAt: hoursFromNow(12), // due soon
    },
    {
      title: "SIP Trunks Upgrade",
      status: RequestStatus.PENDING,
      formData: { customer_name: "BlueOcean Shipping", priority: "P2" },
      requesterId: request2.id,
      dueAt: hoursFromNow(60),
    },
    {
      title: "MPLS Migration",
      status: RequestStatus.IN_PROGRESS,
      formData: { customer_name: "Helios Maritime", priority: "P1", risk_level: 4, risk_notes: "Legacy hardware" },
      requesterId: request1.id, assigneeId: manager.id,
      dueAt: hoursFromNow(-6), // overdue
    },
    {
      title: "QoS Tuning",
      status: RequestStatus.DONE,
      formData: { customer_name: "Delta Freight", priority: "P3" },
      requesterId: request2.id, assigneeId: manager.id,
      dueAt: hoursFromNow(-48),
    },
    {
      title: "New Branch Circuit",
      status: RequestStatus.APPROVED,
      formData: { customer_name: "Seawise Ltd", priority: "P2" },
      requesterId: request2.id, assigneeId: manager.id,
      dueAt: hoursFromNow(72),
    },
    {
      title: "VPN Access for Contractors",
      status: RequestStatus.REJECTED,
      formData: { customer_name: "PortServe", priority: "P3" },
      requesterId: request1.id,
      dueAt: hoursFromNow(-12),
    },
  ];

  const created = [];
  for (const r of rows) {
    const c = await prisma.request.create({
      data: {
        orgId: org.id,
        templateId: tpl.id,
        title: r.title,
        status: r.status,
        formData: r.formData as Prisma.InputJsonValue,
        requesterId: r.requesterId,
        assigneeId: r.assigneeId ?? null,
        dueAt: r.dueAt,
      },
    });
    created.push(c);
  }

  // 6) Snapshots + Audits (simple trail)
  for (const r of created) {
    await prisma.requestSnapshot.create({
      data: { requestId: r.id, status: r.status, formData: r.formData as Prisma.InputJsonValue },
    });
    await prisma.auditEvent.createMany({
      data: [
        { orgId: org.id, requestId: r.id, actorId: r.requesterId, type: "REQUEST_CREATED", data: { title: r.title } },
        { orgId: org.id, requestId: r.id, actorId: r.assigneeId ?? null, type: "STATUS_CONFIRMED", data: { status: r.status } },
      ],
    });
  }

  // 7) Notifications (seed a few)
  await prisma.notification.createMany({
    data: created.slice(0,3).map((r) => ({
      orgId: org.id,
      userId: r.requesterId,
      title: "Request seeded",
      body: `“${r.title}” is ready in the demo.`,
      createdAt: new Date(),
    })),
  });

  console.log("✅ Demo org seeded:", {
    org: org.name,
    users: ["Demo Admin", "Demo Manager", "Alice Requestor", "Bob Requestor"],
    requests: created.length,
  });
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
