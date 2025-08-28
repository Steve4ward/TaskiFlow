import { apiFetch } from "@/lib/api";
import ApprovalsTable from "@/components/approvals/ApprovalsTable";
import type { RequestDTO } from "@/types/request";

export const metadata = { title: "Manager • Approvals" };

async function getApprovals(): Promise<{ items: RequestDTO[] }> {
  const resA = await apiFetch("/api/requests?limit=100&status=IN_REVIEW");
  const resB = await apiFetch("/api/requests?limit=100&status=PENDING");
  const xa = (resA.ok ? (await resA.json()) : { items: [] }) as { items: RequestDTO[] };
  const xb = (resB.ok ? (await resB.json()) : { items: [] }) as { items: RequestDTO[] };
  const seen = new Set<string>();
  const items = [...xa.items, ...xb.items].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  return { items };
}

export default async function Page() {
  const { items } = await getApprovals();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Approvals</h1>
      <ApprovalsTable items={items} />
      {items.length === 0 && (
        <div className="rounded-xl border p-6 text-sm opacity-70">No items awaiting review.</div>
      )}
      <div className="text-xs opacity-60">Tip: open a request to see full history.</div>
    </div>
  );
}
