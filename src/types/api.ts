export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };
export type Paginated<T> = { items: T[]; nextCursor?: string | null; total?: number };