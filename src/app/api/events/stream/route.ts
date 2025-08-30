import { prisma } from "@/lib/db";
import { ensureActiveOrg } from "@/lib/org";
import { sseHeaders, writeEvent, writeComment } from "@/lib/sse";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const org = await ensureActiveOrg();
  const { searchParams } = new URL(req.url);
  let since = searchParams.get("since")
    ? new Date(searchParams.get("since")!)
    : new Date(Date.now() - 60_000);

  let closed = false;
  let tickTimer: NodeJS.Timeout | null = null;
  let pingTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      writeComment(controller, "open");

      const tick = async () => {
        if (closed) return;
        try {
          // MVP self-publish: mark any unprocessed rows processed now
          const now = new Date();
          await prisma.requestEventOutbox.updateMany({
            where: { orgId: org.id, processedAt: null },
            data: { processedAt: now },
          });

          // Fetch anything newly processed since last cursor
          const events = await prisma.requestEventOutbox.findMany({
            where: { orgId: org.id, processedAt: { gt: since } },
            orderBy: { processedAt: "asc" },
            take: 200,
          });

          if (events.length) {
            since = events[events.length - 1]!.processedAt!;
            for (const e of events) {
              writeEvent(controller, {
                id: e.id, orgId: e.orgId, requestId: e.requestId,
                type: e.type, payload: e.payload,
                createdAt: e.createdAt, processedAt: e.processedAt,
              });
            }
          } else {
            writeComment(controller);
          }
        } catch {
          closed = true;
          try { controller.close(); } catch {}
          if (tickTimer) clearInterval(tickTimer);
          if (pingTimer) clearInterval(pingTimer);
        }
      };

      tickTimer = setInterval(tick, 5000);
      pingTimer = setInterval(() => !closed && writeComment(controller, "ping"), 15000);
      tick(); // immediate
    },

    cancel() {
      closed = true;
      if (tickTimer) clearInterval(tickTimer);
      if (pingTimer) clearInterval(pingTimer);
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
