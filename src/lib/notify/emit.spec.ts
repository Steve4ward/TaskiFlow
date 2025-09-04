import { emitNotification } from "./emit";
import { getUserInbox } from "./inbox";

vi.mock("./inbox", () => ({ getUserInbox: vi.fn(() => ({ push: vi.fn() })) }));

it("emits notification on transition", async () => {
  const inbox = await getUserInbox();
  await emitNotification({ type: "REQUEST_MOVED", userId: "u1", payload: { requestId: "r1" } });
  expect(inbox.push).toHaveBeenCalledWith(expect.objectContaining({ type: "REQUEST_MOVED" }));
});
