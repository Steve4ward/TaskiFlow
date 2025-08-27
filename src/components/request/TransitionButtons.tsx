"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NEXTS: Record<string, string[]> = {
  PENDING: ["IN_REVIEW","REJECTED"],
  IN_REVIEW: ["APPROVED","REJECTED","IN_PROGRESS"],
  APPROVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE","REJECTED"],
  REJECTED: [],
  DONE: []
};

export default function TransitionButtons({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const nexts = NEXTS[current] ?? [];
  if (nexts.length === 0) return null;

  const doTrans = async (toStatus: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus }),
      });
      if (res.ok) router.refresh();
      else alert(await res.text());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {nexts.map(s => (
        <button
          key={s}
          disabled={busy}
          onClick={() => doTrans(s)}
          className="rounded border px-3 py-1 text-sm hover:bg-black/5 disabled:opacity-60"
        >
          Move to {s}
        </button>
      ))}
    </div>
  );
}
