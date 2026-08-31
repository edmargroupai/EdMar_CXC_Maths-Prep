import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QueuedAttempt, SyncState } from "./syncStore.types";

export type { QueuedAttempt, QueuedAnalyticsEvent } from "./syncStore.types";

const MAX_RETRIES = 8;

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendingAttempts: [],
      pendingEvents: [],
      lastFlushAt: null,
      isFlushing: false,
      enqueueAttempt: (attempt) => {
        const existing = get().pendingAttempts.find(
          (row) => row.clientAttemptId === attempt.clientAttemptId,
        );
        if (existing) return;

        set((state) => ({
          pendingAttempts: [
            ...state.pendingAttempts,
            {
              ...attempt,
              enqueuedAt: new Date().toISOString(),
              retryCount: 0,
            },
          ],
        }));
      },
      enqueueEvent: (event) =>
        set((state) => ({
          pendingEvents: [
            ...state.pendingEvents,
            { ...event, enqueuedAt: new Date().toISOString() },
          ],
        })),
      markAttemptFlushed: (clientAttemptId) =>
        set((state) => ({
          pendingAttempts: state.pendingAttempts.filter(
            (row) => row.clientAttemptId !== clientAttemptId,
          ),
        })),
      markAttemptPermanentFailure: (clientAttemptId) =>
        set((state) => ({
          pendingAttempts: state.pendingAttempts.filter(
            (row) => row.clientAttemptId !== clientAttemptId,
          ),
        })),
      incrementAttemptRetry: (clientAttemptId) =>
        set((state) => ({
          pendingAttempts: state.pendingAttempts.map((row) => {
            if (row.clientAttemptId !== clientAttemptId) return row;
            const retryCount = row.retryCount + 1;
            if (retryCount >= MAX_RETRIES) {
              return { ...row, retryCount, permanentFailure: true };
            }
            return { ...row, retryCount };
          }),
        })),
      setFlushing: (value) => set({ isFlushing: value }),
      setLastFlushAt: (iso) => set({ lastFlushAt: iso }),
    }),
    { name: "edmar-sync-queue" },
  ),
);

export function dropPermanentFailures(state: SyncState): QueuedAttempt[] {
  return state.pendingAttempts.filter((row) => !row.permanentFailure);
}
