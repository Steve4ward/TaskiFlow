import { z } from "zod";
import { RequestStatus } from "./rbac";

export const CreateRequestSchema = z.object({
  title: z.string().min(3),
  templateId: z.string().optional(),
  formData: z.object({}).catchall(z.unknown()).default({}),
});
export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;

export const ListRequestsSchema = z.object({
  status: z.nativeEnum(
    { PENDING:"PENDING", IN_REVIEW:"IN_REVIEW", APPROVED:"APPROVED", REJECTED:"REJECTED", IN_PROGRESS:"IN_PROGRESS", DONE:"DONE" } as const
  ).optional().transform(v => v as RequestStatus),
  q: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});
export type ListRequestsQuery = z.infer<typeof ListRequestsSchema>;

export const UpdateRequestSchema = z.object({
  formDataPatch: z.object({}).catchall(z.unknown()).default({}),
});
export type UpdateRequestInput = z.infer<typeof UpdateRequestSchema>;

export const TransitionSchema = z.object({
  toStatus: z.enum(["PENDING","IN_REVIEW","APPROVED","REJECTED","IN_PROGRESS","DONE"]),
});
export type TransitionInput = z.infer<typeof TransitionSchema>;

// DTOs the UI consumes
export type RequestDTO = {
  id: string;
  title: string;
  status: RequestStatus;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name?: string | null; email: string };
  assignee?: { id: string; name?: string | null; email: string } | null;
};