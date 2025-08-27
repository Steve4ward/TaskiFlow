export const metadata = { title: "TaskiFlow" };

import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-svh bg-background text-foreground">{children}</body>
      </html>
    </ClerkProvider>
  );
}
