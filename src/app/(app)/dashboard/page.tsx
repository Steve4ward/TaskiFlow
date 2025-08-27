import Link from "next/link";
import { apiFetch } from "@/lib/api";

import type { RequestDTO } from "@/types/request";

export const metadata = { title: "Dashboard • TaskiFlow" };

async function getRequests() {
  const res = await apiFetch("/api/requests?limit=50");
  if (!res.ok) return { items: [] };
  return res.json() as Promise<{ items: RequestDTO[] }>;
}

export default async function Page() {
  const { items } = await getRequests();
  const byStatus = (s: string) => items.filter(i => i.status === s).length;
  const overdue = items.filter(i => i.dueAt && new Date(i.dueAt).getTime() < Date.now()).length;

  const tiles = [
    { label: "Pending", value: byStatus("PENDING") },
    { label: "In Progress", value: byStatus("IN_PROGRESS") + byStatus("IN_REVIEW") },
    { label: "Completed", value: byStatus("DONE") },
    { label: "Overdue", value: overdue },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map(t => (
          <div key={t.label} className="rounded-xl border p-4">
            <div className="text-sm opacity-70">{t.label}</div>
            <div className="mt-1 text-2xl font-bold">{t.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">Recent Requests</div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left opacity-70">
                <th>Title</th><th>Status</th><th>Requester</th><th>Assignee</th><th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0,8).map(r => (
                <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2 border-t">
                  <td><Link className="underline" href={`/requests/${r.id}`}>{r.title}</Link></td>
                  <td>{r.status}</td>
                  <td>{r.requester?.name ?? r.requester?.email}</td>
                  <td>{r.assignee?.name ?? r.assignee?.email ?? "-"}</td>
                  <td>{new Date(r.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td className="px-3 py-6 text-center opacity-70" colSpan={5}>No requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
