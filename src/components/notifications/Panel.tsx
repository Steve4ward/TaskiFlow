"use client";
import { useEffect, useState } from "react";

type N = { id:string; title:string; body:string; createdAt:string; readAt:string|null };

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/notifications", { cache: "no-store" });
    if (r.ok) setItems((await r.json()).items);
    setLoading(false);
  }
  async function markAllRead() {
    const ids = items.filter(i => !i.readAt).map(i=>i.id);
    if (!ids.length) return;
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ ids }) });
    await load();
  }

  useEffect(() => { if (open) load(); }, [open]);

  const unread = items.filter(i => !i.readAt).length;

  return (
    <div className="relative">
      <button onClick={()=>setOpen(v=>!v)} className="rounded border px-2 py-1 text-sm hover:bg-black/5">
        🔔 {unread ? <span className="ml-1 rounded bg-rose-500 px-1 text-white text-[10px]">{unread}</span> : null}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl borde shadow p-2 z-50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Notifications</div>
            <button onClick={markAllRead} className="text-xs underline">Mark all read</button>
          </div>
          {loading && <div className="text-xs opacity-60 p-2">Loading…</div>}
          <ul className="max-h-80 overflow-auto">
            {items.map(n => (
              <li key={n.id} className={`p-2 rounded ${n.readAt ? "" : "bg-black/5"}`}>
                <div className="text-sm font-medium">{n.title}</div>
                {n.body && <div className="text-xs opacity-70">{n.body}</div>}
                <div className="text-[10px] opacity-60 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </li>
            ))}
            {!items.length && !loading && <li className="p-2 text-xs opacity-60">Nothing yet.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
