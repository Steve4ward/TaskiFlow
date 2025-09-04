// import { api, authHeaders } from "@/test/utils";

// describe("Routing guards", () => {
//   it("rejects unauthenticated", async () => {
//     const res = await api().get("/api/requests");
//     expect(res.status).toBe(401);
//   });

//   it("scopes by orgId", async () => {
//     const res = await api().get("/api/requests").set(authHeaders({ userId: "u1", orgId: "orgA", role: "manager" }));
//     expect(res.status).toBe(200);
//     for (const r of res.body.data) expect(r.orgId).toBe("orgA");
//   });
// });

// src/app/api/requests/route.spec.ts
import * as route from "@/app/api/requests/route"; // <- valid path
import { authHeaders, makeReq, readJson } from "@/test/utils";

describe("Routing guards", () => {
  it("rejects unauthenticated", async () => {
    const res = await route.GET(makeReq("/api/requests"));
    expect(res.status).toBe(401);
  });

  it("scopes by orgId", async () => {
    const res = await route.GET(makeReq("/api/requests", { headers: authHeaders({ userId: "u1", orgId: "orgA", role: "manager" }) }));
    expect(res.status).toBe(200);
    const body = await readJson<{ data: Array<{ orgId: string }> }>(res);
    for (const r of body.data) expect(r.orgId).toBe("orgA");
  });
});
