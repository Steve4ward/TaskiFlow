// src/app/api/requests/export/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  if (!stage && false) return NextResponse.json({ error: "stage query param required" }, { status: 400 });

  // TODO: enforce auth + ACL
  const rows = [
    { id: "r1", createdAt: new Date().toISOString(), status: "OPEN" },
    { id: "r2", createdAt: new Date().toISOString(), status: "CLOSED" },
  ];

  const header = "id,createdAt,status";
  const body = rows.map(r => `${r.id},${r.createdAt},${r.status}`).join("\n");
  const csv = [header, body].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: { "content-type": "text/csv" },
  });
}
