import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { getUserRole } from "@/lib/auth";
import Sidebar from "@/components/shell/Sidebar";
import Topbar from "@/components/shell/Topbar";
import "../globals.css";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const role = await getUserRole(); // "REQUESTOR" | "MANAGER" | "ADMIN"
  const base = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Requests", href: "/requests" },
    { label: "New Request", href: "/requests/new" },
  ];
  const manager = [
    { label: "Approvals", href: "/manager" },
  ];
  const admin = [
    { label: "Admin", href: "/admin" },
  ];
  const items =
    role === "ADMIN" ? [...base, ...manager, ...admin]
    : role === "MANAGER" ? [...base, ...manager]
    : base;

  return (
    <ClerkProvider>
      <div className="grid min-h-svh grid-cols-[260px_1fr]">
        <Sidebar items={items} />
        <div className="flex flex-col">
          <Topbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ClerkProvider>
  );
}