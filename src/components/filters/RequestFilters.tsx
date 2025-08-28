"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const STATUSES = ["", "PENDING","IN_REVIEW","APPROVED","IN_PROGRESS","REJECTED","DONE"] as const;

export default function RequestFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");

  useEffect(() => { setQ(sp.get("q") ?? ""); setStatus(sp.get("status") ?? ""); setFrom(sp.get("from") ?? ""); setTo(sp.get("to") ?? ""); }, [sp]);

  function apply() {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("limit","100");
    router.push(`/dashboard?${p.toString()}`);
  }

  function reset() {
    setQ(""); setStatus(""); setFrom(""); setTo("");
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <div className="flex flex-col">
        <label className="text-xs opacity-70 mb-1">Search</label>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="title…" className="border rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs opacity-70 mb-1">Status</label>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
          {STATUSES.map(s => <option key={s} value={s}>{s || "All"}</option>)}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs opacity-70 mb-1">From</label>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs opacity-70 mb-1">To</label>
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
      </div>
      <button onClick={apply} className="border rounded px-3 py-1 text-sm hover:bg-black/5">Apply</button>
      <button onClick={reset} className="border rounded px-3 py-1 text-sm hover:bg-black/5">Reset</button>
    </div>
  );
}
