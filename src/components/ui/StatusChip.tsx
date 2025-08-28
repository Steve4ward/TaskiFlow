export default function StatusChip({ s }: { s: string }) {
  const cls =
    s === "PENDING" ? "bg-yellow-100 text-yellow-800" :
    s === "IN_REVIEW" ? "bg-blue-100 text-blue-800" :
    s === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
    s === "IN_PROGRESS" ? "bg-indigo-100 text-indigo-800" :
    s === "DONE" ? "bg-green-100 text-green-800" :
    s === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-zinc-100 text-zinc-800";
  return <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${cls}`}>{s.replace("_"," ")}</span>;
}