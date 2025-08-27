import { RequestStatus } from "@prisma/client";
import { getUserRole } from "@/lib/auth";

const ALLOWED: Record<RequestStatus, RequestStatus[]> = {
  PENDING:     ["IN_REVIEW", "REJECTED"],
  IN_REVIEW:   ["APPROVED", "REJECTED", "IN_PROGRESS"],
  APPROVED:    ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE", "REJECTED"],
  REJECTED:    [], // terminal
  DONE:        [], // terminal
};

export async function canTransition(from: RequestStatus, to: RequestStatus) {
  const role = await getUserRole();
  if (!(ALLOWED[from] ?? []).includes(to)) return { ok: false, reason: "invalid_transition" };
  if (role === "REQUESTOR") return { ok: false, reason: "insufficient_role" };
  return { ok: true as const };
}
