import { z } from "zod";

export const CreateRequestSchema = z.object({
  title: z.string().min(3),
  templateId: z.string().optional(),
  formData: z.object({}).catchall(z.unknown()).default({}),
});

export const ListRequestsSchema = z.object({
  status: z.string().optional(),      // e.g., PENDING, IN_REVIEW...
  q: z.string().optional(),           // title contains
  from: z.coerce.date().optional(),   // createdAt >= from
  to: z.coerce.date().optional(),     // createdAt <= to
  limit: z.coerce.number().min(1).max(100).default(50),
});
