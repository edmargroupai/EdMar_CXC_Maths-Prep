import { describe, expect, it } from "vitest";
import { useSyncStore } from "./syncStore";

describe("syncStore", () => {
  it("deduplicates queued attempts by clientAttemptId", () => {
    useSyncStore.setState({
      pendingAttempts: [],
      pendingEvents: [],
      lastFlushAt: null,
      isFlushing: false,
    });

    const attempt = {
      clientAttemptId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      questionVersionId: "11111111-2222-3333-4444-555555555555",
      sessionId: "66666666-7777-8888-9999-000000000000",
      rawAnswer: "A",
      wasSkipped: false,
      clientIsCorrect: true,
      durationMs: 1200,
      clientCreatedAt: "2026-08-31T12:00:00.000Z",
    };

    useSyncStore.getState().enqueueAttempt(attempt);
    useSyncStore.getState().enqueueAttempt(attempt);

    expect(useSyncStore.getState().pendingAttempts).toHaveLength(1);
  });
});
