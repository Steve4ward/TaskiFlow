export const metadata = { title: "TaskiFlow" };
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const dynamic = "force-dynamic";

const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const useClerk = pk.startsWith("pk_"); // guards CI/preview without real keys

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en"><body className="min-h-svh bg-background text-foreground">{children}</body></html>
  );
  return useClerk ? <ClerkProvider publishableKey={pk}>{body}</ClerkProvider> : body;
}