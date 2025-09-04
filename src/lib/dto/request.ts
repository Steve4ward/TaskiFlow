import { z } from "zod";

export const UserMiniDTO = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
});
export type UserMiniDTO = z.infer<typeof UserMiniDTO>;

export const RequestItemDTO = z.object({
  id: z.string(),
  orgId: z.string(),
  title: z.string(),
  status: z.string(),
  dueAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  requester: UserMiniDTO.nullable(),
  assignee: UserMiniDTO.nullable(),
});
export type RequestItemDTO = z.infer<typeof RequestItemDTO>;

export const RequestsListResponseDTO = z.object({
  items: z.array(RequestItemDTO),
});
export type RequestsListResponseDTO = z.infer<typeof RequestsListResponseDTO>;

export const CreateRequestResponseDTO = z.object({
  id: z.string(),
});
export type CreateRequestResponseDTO = z.infer<typeof CreateRequestResponseDTO>;
