import { headers } from "next/headers";

export async function absoluteUrl(path: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const fallback = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const base = host ? `${proto}://${host}` : fallback;
  if (!base) throw new Error("No host and NEXT_PUBLIC_APP_URL not set");
  return `${base}${path}`;
}