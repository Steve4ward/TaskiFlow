export type Role = "REQUESTOR" | "MANAGER" | "ADMIN";
export const ROLE_RANK: Record<Role, number> = { REQUESTOR: 0, MANAGER: 1, ADMIN: 2 };

export type RequestStatus =
  | "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "DONE";