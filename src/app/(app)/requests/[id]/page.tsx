import TransitionButtons from "@/components/request/TransitionButtons";

type Status = "PENDING" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
type EventItem = { id: string; type: string; createdAt: string };
type SnapshotItem = { id: string; status: Status; createdAt: string };
type RequestDetail = {
  id: string;
  title: string;
  status: Status;
  formData: unknown;
  recentEvents: EventItem[];
  snapshots: SnapshotItem[];
};

async function getDetail(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/requests/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Not found");
  return res.json() as Promise<RequestDetail>;
}

export default async function Page({ params }: { params: { id: string }}) {
  const r = await getDetail(params.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{r.title}</h1>
        <div className="opacity-70 text-sm">Status: {r.status}</div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="mb-2 text-sm font-medium">Form data</div>
        <pre className="text-xs overflow-auto">{JSON.stringify(r.formData, null, 2)}</pre>
      </div>

      <TransitionButtons id={r.id} current={r.status} />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <div className="mb-2 text-sm font-medium">Recent Events</div>
          <ul className="text-sm space-y-1">
            {r.recentEvents?.map((e) => (
              <li key={e.id} className="opacity-80">{e.type} • {new Date(e.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <div className="mb-2 text-sm font-medium">Snapshots</div>
          <ul className="text-sm space-y-1">
            {r.snapshots?.map((s) => (
              <li key={s.id} className="opacity-80">{s.status} • {new Date(s.createdAt).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
