export function calcDueAt(opts: { createdAt?: Date; slaHours?: number | null }) {
  const base = opts.createdAt ?? new Date();
  const hrs = (opts.slaHours ?? 72) || 72;
  return new Date(base.getTime() + hrs * 3600 * 1000);
}

export function isOverdue(dueAt?: string | Date | null, status?: string) {
  if (!dueAt) return false;
  if (status === "DONE" || status === "REJECTED") return false;
  const ts = typeof dueAt === "string" ? Date.parse(dueAt) : dueAt.getTime();
  return ts < Date.now();
}

export function isDueSoon(dueAt?: string | Date | null, status?: string, hours = 24) {
  if (!dueAt) return false;
  if (status === "DONE" || status === "REJECTED") return false;
  const ts = typeof dueAt === "string" ? Date.parse(dueAt) : dueAt.getTime();
  const now = Date.now();
  return ts >= now && ts <= now + hours * 3600 * 1000;
}
