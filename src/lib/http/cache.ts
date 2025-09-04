export function applyListCacheHeaders(res: Response) {
  res.headers.set("Cache-Control", "public, max-age=10, s-maxage=60, stale-while-revalidate=120");
  res.headers.set("Vary", "authorization, x-org-id");
  return res;
}
