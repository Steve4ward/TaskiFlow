"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { RequestDTO } from "@/types/request";

const NEXTS: Record<string, string[]> = {
  PENDING: ["IN_REVIEW","REJECTED"],
  IN_REVIEW: ["APPROVED","REJECTED","IN_PROGRESS"],
  APPROVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE","REJECTED"],
  REJECTED: [],
  DONE: []
};

const FINAL = new Set(["DONE", "REJECTED"]);

type SortKey = "dueAt" | "status";
type SortDir = "asc" | "desc";

function fmt(dt?: string | null) {
  if (!dt) return "-";
  const d = new Date(dt);
  return isNaN(+d) ? "-" : d.toLocaleString();
}


function isDueSoon(dueAt?: string | null) {
  if (!dueAt) return false;
  const ms = new Date(dueAt).getTime() - Date.now();
  return ms > 0 && ms <= 48 * 3600 * 1000;
}

function caret(dir: SortDir, active: boolean) {
  if (!active) return "↕";
  return dir === "asc" ? "▲" : "▼";
}

export default function ApprovalsTable({ items }: { items: RequestDTO[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("dueAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(k: SortKey) {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  const rows = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let av: number | string = "";
      let bv: number | string = "";
      if (sortKey === "dueAt") {
        av = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
        bv = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
      } else {
        av = a.status ?? "";
        bv = b.status ?? "";
      }
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [items, sortKey, sortDir]);

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
            <th>Title</th>
            <th>
              <button
                type="button"
                onClick={() => toggleSort("status")}
                aria-sort={sortKey === "status" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
              >
                Status <span className="text-xs">{caret(sortDir, sortKey === "status")}</span>
              </button>
            </th>
            <th>Requester</th>
            <th>Assignee</th>
            <th>
              <button
                type="button"
                onClick={() => toggleSort("dueAt")}
                aria-sort={sortKey === "dueAt" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
              >
                Due <span className="text-xs">{caret(sortDir, sortKey === "dueAt")}</span>
              </button>
            </th>
            <th>Updated</th>
            <th className="w-64">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const nexts = NEXTS[r.status] ?? [];
            const dueSoon = !FINAL.has(r.status) && isDueSoon(r.dueAt);
            return (
              <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2 border-t">
                <td>
                  <Link className="underline" href={`/requests/${r.id}`}>
                    {r.title}
                  </Link>
                </td>
                <td>{r.status}</td>
                <td>{r.requester?.name ?? r.requester?.email ?? "-"}</td>
                <td>{r.assignee?.name ?? r.assignee?.email ?? "-"}</td>
                <td>
                  {r.dueAt ? new Date(r.dueAt).toLocaleDateString() : "-"}
                  {dueSoon ? (
                    <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-900 align-middle">
                      Due soon
                    </span>
                  ) : null}
                </td>
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
                      {s.replace("_", " ")}
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