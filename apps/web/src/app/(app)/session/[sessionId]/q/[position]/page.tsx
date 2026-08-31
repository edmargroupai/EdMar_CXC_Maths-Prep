"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuestionScreen } from "@/features/practice/components/QuestionScreen";
import { useSessionStore } from "@/stores/sessionStore";

export default function SessionQuestionPage() {
  const params = useParams<{ sessionId: string; position: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;
  const position = Number.parseInt(params.position, 10);
  const items = useSessionStore((s) => s.items);
  const storedSessionId = useSessionStore((s) => s.sessionId);

  useEffect(() => {
    if (!storedSessionId || storedSessionId !== sessionId || items.length === 0) {
      router.replace("/practice/setup");
    }
  }, [storedSessionId, sessionId, items.length, router]);

  const item = items[position];
  if (!item || Number.isNaN(position)) {
    return null;
  }

  return (
    <QuestionScreen
      sessionId={sessionId}
      position={position}
      item={item}
      total={items.length}
    />
  );
}
