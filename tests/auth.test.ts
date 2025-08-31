import { describe, it, expect } from "vitest";
import { mapRole } from "@/lib/auth";

describe("mapRole", () => {
  it("maps Clerk org:admin to ADMIN", () => {
    expect(mapRole("org:admin")).toBe("ADMIN");
  });
  it("defaults to MANAGER if not set", () => {
    expect(mapRole(undefined)).toBe("MANAGER");
  });
});
