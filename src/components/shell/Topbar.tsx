"use client";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import NotificationsPanel from "@/components/notifications/Panel";

export default function Topbar() {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2">
      <div className="text-sm opacity-70">App</div>
      <div className="flex items-center gap-3">
        <NotificationsPanel />
        <OrganizationSwitcher />
        <UserButton />
      </div>
    </div>
  );
}
