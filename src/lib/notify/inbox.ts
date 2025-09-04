type Inbox = { push: (msg: unknown) => Promise<void> | void };
export async function getUserInbox(_userId: string): Promise<Inbox> {
  return { push: async () => {} };
}
