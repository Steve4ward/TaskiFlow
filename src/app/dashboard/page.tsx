import { SignedIn, SignedOut, RedirectToSignIn, OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const { orgId } = await auth();
  return (
    <>
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <OrganizationSwitcher />
            <UserButton />
          </div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p>Active org: <code>{orgId ?? "none"}</code></p>
        </div>
      </SignedIn>
    </>
  );
}