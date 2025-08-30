export const encoder = new TextEncoder();

export function sseHeaders() {
  return new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });
}

export function safeEnqueue(controller: ReadableStreamDefaultController, chunk: string) {
  try {
    controller.enqueue(encoder.encode(chunk));
  } catch {
    // controller already closed — ignore
  }
}

export function writeEvent(controller: ReadableStreamDefaultController, data: unknown) {
  safeEnqueue(controller, `data: ${JSON.stringify(data)}\n\n`);
}

export function writeComment(controller: ReadableStreamDefaultController, text = "heartbeat") {
  safeEnqueue(controller, `: ${text}\n\n`);
}

type Client = { orgId: string; write: (chunk: string) => void; close: () => void };

const g = globalThis as unknown as { __sse?: { clients: Set<Client> } };
export const sse = (g.__sse ??= { clients: new Set<Client>() });

export function emit(orgId: string, type: string, payload: unknown) {
  const frame = `event: ${type}\n` + `data: ${JSON.stringify(payload)}\n\n`;
  for (const c of sse.clients) if (c.orgId === orgId) c.write(frame);
}