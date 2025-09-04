import { getUserInbox } from "./inbox";

export async function emitNotification(evt: { type: string; userId: string; payload?: unknown }) {
  const inbox = await getUserInbox(evt.userId);
  await inbox.push({ ts: Date.now(), ...evt });
}
