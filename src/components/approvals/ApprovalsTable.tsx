"use client";

import Link from "next/link";
import { useState } from "react";
import type { RequestDTO } from "@/types/request";

const NEXTS: Record<string, string[]> = {
  PENDING: ["IN_REVIEW","REJECTED"],
  IN_REVIEW: ["APPROVED","REJECTED","IN_PROGRESS"],
  APPROVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE","REJECTED"],
  REJECTED: [],
  DONE: []
};

function fmt(dt?: string | null) {
  if (!dt) return "-";
  const d = new Date(dt);
  return isNaN(+d) ? "-" : d.toLocaleString();
}

export default function ApprovalsTable({ items }: { items: RequestDTO[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function move(id: string, toStatus: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/requests/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      if (!res.ok) alert(await res.text());
      else location.reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="[&>th]:px-3 [&>th]:py-2 text-left opacity-70">
            <th>Title</th><th>Status</th><th>Requester</th><th>Assignee</th><th>Due</th><th>Updated</th><th className="w-64">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r: RequestDTO) => {
            const nexts = NEXTS[r.status] ?? [];
            return (
              <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2 border-t">
                <td><Link className="underline" href={`/requests/${r.id}`}>{r.title}</Link></td>
                <td>{r.status}</td>
                <td>{r.requester?.name ?? r.requester?.email}</td>
                <td>{r.assignee?.name ?? r.assignee?.email ?? "-"}</td>
                <td>{r.dueAt ? new Date(r.dueAt).toLocaleDateString() : "-"}</td>
                <td>{fmt(r.updatedAt)}</td>
                <td className="flex flex-wrap gap-2">
                  {nexts.map((s) => (
                    <button
                      key={s}
                      disabled={busyId === r.id}
                      onClick={() => move(r.id, s)}
                      className="rounded border px-2 py-1 hover:bg-black/5 disabled:opacity-60"
                      title={`Move to ${s}`}
                    >
                      {s.replace("_"," ")}
                    </button>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
