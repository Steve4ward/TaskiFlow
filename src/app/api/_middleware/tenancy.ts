export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type TenantCtx = {
  orgId: string;
  userId?: string;
  role?: string;
};

export function ensureTenant(input: { headers: Headers }): TenantCtx {
  const h = input.headers;
  const orgId = h.get("x-org-id")?.trim();
  if (!orgId) throw new HttpError(400, "Missing x-org-id");

  const userId = h.get("x-user-id")?.trim() || undefined;
  const role = h.get("x-role")?.trim() || undefined;

  const ctx: TenantCtx = { orgId };
  if (userId !== undefined) ctx.userId = userId;
  if (role !== undefined) ctx.role = role;

  return ctx;
}
