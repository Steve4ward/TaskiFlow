import { computeAcl } from "./computeAcl";

describe("ACL per stage", () => {
  it("hides non-visible paths", () => {
    const acl = computeAcl({ stageKey: "REVIEW", role: "manager" });
    expect(acl.visible.has("sensitiveField")).toBe(false);
  });

  it("enforces required paths on submit", () => {
    const acl = computeAcl({ stageKey: "APPROVAL", role: "manager" });
    expect(acl.required.has("decision")).toBe(true);
  });
});
