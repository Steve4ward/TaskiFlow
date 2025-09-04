// src/lib/dto/map.ts
import type { RequestsListResponseDTO, RequestItemDTO } from "@/lib/dto/request";
import type { Prisma } from "@prisma/client";

type RequestRow = Prisma.RequestGetPayload<{
  select: {
    id: true; orgId: true; title: true; status: true; dueAt: true;
    createdAt: true; updatedAt: true;
    requester: { select: { id: true; name: true; email: true } };
    assignee:  { select: { id: true; name: true; email: true } };
  };
}>;

export function mapRequestToDTO(r: RequestRow): RequestItemDTO {
  return {
    id: r.id,
    orgId: r.orgId,
    title: r.title,
    status: r.status,
    dueAt: r.dueAt instanceof Date ? r.dueAt.toISOString() : r.dueAt ?? null,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    requester: r.requester
      ? { id: r.requester.id, name: r.requester.name ?? null, email: r.requester.email ?? null }
      : null,
    assignee: r.assignee
      ? { id: r.assignee.id, name: r.assignee.name ?? null, email: r.assignee.email ?? null }
      : null,
  };
}

export function mapList(items: RequestRow[]): RequestsListResponseDTO {
  return { items: items.map(mapRequestToDTO) };
}
