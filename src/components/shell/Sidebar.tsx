"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({ items }: { items: {label:string; href:string}[] }) {
  const pathname = usePathname();
  return (
    <aside className="border-r bg-white/50 dark:bg-zinc-900/40 p-4">
      <div className="mb-6 text-xl font-semibold">TaskiFlow</div>
      <nav className="space-y-1">
        {items.map(it => {
          const active = pathname === it.href || pathname?.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`block rounded px-3 py-2 text-sm ${active ? "bg-black/5 dark:bg-white/10 font-medium" : "hover:bg-black/5 dark:hover:bg-white/10"}`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
