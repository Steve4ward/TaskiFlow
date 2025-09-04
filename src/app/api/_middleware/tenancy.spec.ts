// src/app/api/_middleware/tenancy.spec.ts
import { ensureTenant, HttpError } from "./tenancy";

it("throws if orgId missing", () => {
  expect(() => ensureTenant({ headers: new Headers() })).toThrow(HttpError);
});

it("passes when orgId present", () => {
  const headers = new Headers({ "x-org-id": "orgA" });
  expect(() => ensureTenant({ headers })).not.toThrow();
});
