import * as route from "@/app/api/requests/export/route";
import { authHeaders, makeReq } from "@/test/utils";

it("returns CSV with ACL-filtered columns", async () => {
  const req = makeReq("/api/requests/export?stage=REVIEW", {
    headers: authHeaders({ userId: "u1", orgId: "orgA", role: "manager" }),
  });
  const res = await route.GET(req);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toMatch(/text\/csv/);

  const text = await res.text();
  const csv = text.split("\n");
  expect(csv[0]).toContain("id,createdAt,status");      // baseline cols
  expect(csv[0]).not.toContain("sensitiveField");        // hidden by ACL
});
