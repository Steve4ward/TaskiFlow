import { canTransition } from "./transition";

const edges = [
  ["DRAFT","REVIEW"],
  ["REVIEW","APPROVED"],
  ["REVIEW","REJECTED"],
] as const;

describe("Workflow transitions", () => {
  it("allows valid edges", () => {
    expect(canTransition("DRAFT","REVIEW", edges)).toBe(true);
  });
  it("blocks invalid edges", () => {
    expect(canTransition("APPROVED","REVIEW", edges)).toBe(false);
  });
});
