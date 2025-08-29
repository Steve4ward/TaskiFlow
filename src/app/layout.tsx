export const metadata = { title: "TaskiFlow" };
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-svh bg-background text-foreground">{children}</body>
    </html>
  );
}