"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SittingMonth } from "@edmar/types";

interface OnboardingState {
  examSittingYear: number | null;
  examSittingMonth: SittingMonth | null;
  interestTopicIds: string[];
  anonUserId: string | null;
  setExamSitting: (year: number, month: SittingMonth) => void;
  setInterestTopicIds: (ids: string[]) => void;
  setAnonUserId: (id: string) => void;
  clearAnonUserId: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      examSittingYear: null,
      examSittingMonth: null,
      interestTopicIds: [],
      anonUserId: null,
      setExamSitting: (year, month) =>
        set({ examSittingYear: year, examSittingMonth: month }),
      setInterestTopicIds: (ids) => set({ interestTopicIds: ids }),
      setAnonUserId: (id) => set({ anonUserId: id }),
      clearAnonUserId: () => set({ anonUserId: null }),
    }),
    {
      name: "edmar-onboarding",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        examSittingYear: state.examSittingYear,
        examSittingMonth: state.examSittingMonth,
        interestTopicIds: state.interestTopicIds,
        anonUserId: state.anonUserId,
      }),
    },
  ),
);
