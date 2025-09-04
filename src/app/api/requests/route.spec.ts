// src/app/api/requests/route.spec.ts

function makeNextReq(url: string, init?: RequestInit) {
  const abs = url.startsWith("http") ? url : `http://test${url}`;
  const req = new Request(abs, init);
  return Object.assign(req, { nextUrl: new URL(abs) }) as unknown as import("next/server").NextRequest;
}

vi.mock("server-only", () => ({})); // hoisted

import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { authHeaders, readJson } from "@/test/utils";

beforeEach(() => vi.resetModules());
afterEach(() => vi.clearAllMocks());

it("REQUESTOR sees only own items", async () => {
  vi.mock("@/lib/org", () => ({ ensureActiveOrg: async () => ({ id: "orgA" }) }));
  vi.mock("@/lib/user", () => ({ ensureCurrentUser: async () => ({ id: "u1" }) }));
  vi.mock("@/lib/auth", () => ({ getUserRole: async () => "REQUESTOR" }));

  const route = await import("./route");
  const res = await route.GET(makeNextReq("/api/requests?limit=50", {
    headers: authHeaders({ userId: "u1", orgId: "orgA", role: "requestor" }),
  }));
  expect(res.status).toBe(200);
  const body = await readJson<{ items: Array<{ requester: { id: string } }> }>(res);
  for (const r of body.items) expect(r.requester.id).toBe("u1");
});

it("scopes by orgId", async () => {
  vi.mock("@/lib/org", () => ({ ensureActiveOrg: async () => ({ id: "orgA" }) }));
  vi.mock("@/lib/user", () => ({ ensureCurrentUser: async () => ({ id: "u1" }) }));
  vi.mock("@/lib/auth", () => ({ getUserRole: async () => "MANAGER" }));

  const route = await import("./route");
  const res = await route.GET(
    makeNextReq("/api/requests?limit=50", {
      headers: authHeaders({ userId: "u1", orgId: "orgA", role: "manager" }),
    })
  );
  expect(res.status).toBe(200);
  const body = await readJson<{ items: Array<{ orgId: string }> }>(res);
  for (const r of body.items) expect(r.orgId).toBe("orgA");
});