import { emitNotification } from "./emit";

const h = vi.hoisted(() => {
  return { push: vi.fn() };
});

vi.mock("./inbox", () => {
  return {
    getUserInbox: vi.fn(async () => ({ push: h.push })),
  };
});

it("emits notification on transition", async () => {
  await emitNotification({ type: "REQUEST_MOVED", userId: "u1", payload: { requestId: "r1" } });
  expect(h.push).toHaveBeenCalledWith(expect.objectContaining({ type: "REQUEST_MOVED" }));
});