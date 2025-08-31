import type { NextRequest } from "next/server";
import type { Prisma, RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ensureActiveOrg } from "@/lib/org";

type ReportRow = {
  id: string;
  title: string;
  status: string;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  requester: { name: string | null; email: string } | null;
  assignee: { name: string | null; email: string } | null;
};

function toISODate(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function csvEscape(v: unknown) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsToCSV(rows: ReportRow[]) {
  const headers = [
    "id","title","status","requester_name","requester_email","assignee_name","assignee_email",
    "due_at","created_at","updated_at"
  ];
  const body = rows.map(r => [
    r.id,
    r.title,
    r.status,
    r.requester?.name ?? "",
    r.requester?.email ?? "",
    r.assignee?.name ?? "",
    r.assignee?.email ?? "",
    r.dueAt ? new Date(r.dueAt).toISOString() : "",
    new Date(r.createdAt).toISOString(),
    new Date(r.updatedAt).toISOString(),
  ].map(csvEscape).join(","));
  return [headers.join(","), ...body].join("\n");
}

// typed route signature for Next 15: params is Promise if you use it (we don't here)
export async function GET(req: NextRequest) {
  const org = await ensureActiveOrg();
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase(); // csv | json
  const range = (searchParams.get("range") ?? "last_30").toLowerCase(); // last_7 | last_30 | all
  const status = searchParams.get("status") ?? ""; // optional status filter

  let from: Date | undefined;
  if (range === "last_7")  from = new Date(Date.now() - 7  * 24 * 3600 * 1000);
  if (range === "last_30") from = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const where: Prisma.RequestWhereInput = { orgId: org.id };
  if (from) where.createdAt = { gte: from };
  if (status) where.status = status as RequestStatus;

  const rows = await prisma.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, status: true, dueAt: true, createdAt: true, updatedAt: true,
      requester: { select: { name: true, email: true } },
      assignee:  { select: { name: true, email: true } },
    },
    take: 5000, // guardrail
  });

  if (format === "json") {
    return Response.json({
      meta: { orgId: org.id, range, from: from ? toISODate(from) : null, generatedAt: new Date().toISOString(), count: rows.length },
      items: rows,
    });
  }

  const csv = rowsToCSV(rows);
  const filename = `taskiflow-requests-${range}-${toISODate(new Date()).slice(0,10)}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
