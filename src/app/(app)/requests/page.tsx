import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { RequestDTO } from "@/types/request";

async function getData() {
  const res = await apiFetch("/api/requests?limit=100");
  if (!res.ok) return { items: [] };
  return res.json() as Promise<{ items: RequestDTO[] }>;
}

export default async function Page() {
  const { items } = await getData();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">My Requests</h1>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead><tr className="[&>th]:px-3 [&>th]:py-2 text-left opacity-70">
            <th>Title</th><th>Status</th><th>Assignee</th><th>Due</th><th>Updated</th>
          </tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2 border-t">
                <td><Link className="underline" href={`/requests/${r.id}`}>{r.title}</Link></td>
                <td>{r.status}</td>
                <td>{r.assignee?.name ?? r.assignee?.email ?? "-"}</td>
                <td>{r.dueAt ? new Date(r.dueAt).toLocaleDateString() : "-"}</td>
                <td>{new Date(r.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="px-3 py-6 text-center opacity-70" colSpan={5}>No requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
