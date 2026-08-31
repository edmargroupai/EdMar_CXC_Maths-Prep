import type { ReactNode } from "react";
import { ExamSessionStrip } from "@/components/app/exam-session-strip";
import { demoExamQuestion } from "@/lib/mock/app-shell";

export default function DemoExamLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ExamSessionStrip
        paperTitle={demoExamQuestion.paperTitle}
        position={demoExamQuestion.position}
        total={demoExamQuestion.total}
      />
      {children}
    </>
  );
}
