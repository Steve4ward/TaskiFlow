import { NextRequest } from "next/server";

export function authHeaders(h: { userId?: string; orgId?: string; role?: string } = {}) {
  const headers = new Headers();
  if (h.userId) headers.set("x-user-id", h.userId);
  if (h.orgId) headers.set("x-org-id", h.orgId);
  if (h.role) headers.set("x-role", h.role);
  return headers;
}

export function makeReq(url: string, init: RequestInit = {}) {
  const full = new URL(url, "http://test.local");
  return new Request(full, init) as unknown as NextRequest;
}

export async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}