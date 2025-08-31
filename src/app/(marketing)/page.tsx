import Link from "next/link";

export const metadata = { title: "TaskiFlow — Candidate-first workflow automation" };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl p-8 space-y-10">
      <header className="flex items-center justify-between">
        <div className="text-xl font-semibold">TaskiFlow</div>
        <nav className="space-x-4 text-sm">
          <Link href="/sign-in" className="underline">Sign in</Link>
          <Link href="/sign-up" className="underline">Create account</Link>
        </nav>
      </header>

      <section className="space-y-4">
        <h1 className="text-4xl font-bold leading-tight">
          One evolving request form across every team.
        </h1>
        <p className="text-lg opacity-80">
          Centralize, automate, and visualize customer workflows — from Sales to IT to Finance.
        </p>
        <div className="flex gap-3">
          <Link href="/sign-up" className="rounded border px-4 py-2 text-sm font-medium hover:bg-black/5">
            Get started
          </Link>
          <form action="/api/demo/seed-current" method="post">
            <button className="rounded border px-4 py-2 text-sm hover:bg-black/5">Try the Demo</button>
          </form>
        </div>  
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { h: "Chaos → Clarity", p: "Kill email threads. One source of truth." },
          { h: "Workflow Automation", p: "Auto-route by type, priority, workload." },
          { h: "Realtime & Audit", p: "Live updates with full history." },
        ].map((c) => (
          <div key={c.h} className="rounded-xl border p-4">
            <div className="text-sm font-medium">{c.h}</div>
            <div className="text-sm opacity-70">{c.p}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
