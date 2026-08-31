import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DifficultyMode, PracticeMode } from "@edmar/types";

export interface SessionItemRow {
  position: number;
  question_id: string;
  question_version_id: string;
  option_order: string[] | null;
}

interface SessionState {
  sessionId: string | null;
  mode: PracticeMode | null;
  difficultyMode: DifficultyMode | null;
  items: SessionItemRow[];
  currentPosition: number;
  scopeIds: string[];
  setSession: (data: {
    sessionId: string;
    mode: PracticeMode;
    difficultyMode: DifficultyMode;
    items: SessionItemRow[];
    scopeIds: string[];
  }) => void;
  setPosition: (position: number) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      mode: null,
      difficultyMode: null,
      items: [],
      currentPosition: 0,
      scopeIds: [],
      setSession: (data) =>
        set({
          sessionId: data.sessionId,
          mode: data.mode,
          difficultyMode: data.difficultyMode,
          items: data.items,
          scopeIds: data.scopeIds,
          currentPosition: 0,
        }),
      setPosition: (position) => set({ currentPosition: position }),
      clearSession: () =>
        set({
          sessionId: null,
          mode: null,
          difficultyMode: null,
          items: [],
          currentPosition: 0,
          scopeIds: [],
        }),
    }),
    { name: "edmar-practice-session" },
  ),
);
