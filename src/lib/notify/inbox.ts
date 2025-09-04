type Inbox = { push: (msg: unknown) => Promise<void> | void };
export async function getUserInbox(): Promise<Inbox> {
  return { push: async () => {} };
}
