import { headers } from "next/headers";
import { absoluteUrl } from "@/lib/url";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const h = await headers();
  const url = await absoluteUrl(path);
  const cookie = h.get("cookie") ?? "";
  return fetch(url, {
    cache: "no-store",
    ...init,
    headers: { ...init.headers, cookie },
  });
}
