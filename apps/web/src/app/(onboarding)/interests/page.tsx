"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ensureAnonymousSession } from "@/lib/auth/ensure-anonymous-session";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useOnboardingStore } from "@/stores/onboardingStore";

interface TopicRow {
  id: string;
  name: string;
  code: string;
}

export default function OnboardingInterestsPage() {
  const router = useRouter();
  const interestTopicIds = useOnboardingStore((s) => s.interestTopicIds);
  const setInterestTopicIds = useOnboardingStore((s) => s.setInterestTopicIds);

  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [selected, setSelected] = useState<string[]>(interestTopicIds);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTopics() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        await ensureAnonymousSession(supabase);

        const { data, error } = await supabase
          .from("topics")
          .select("id, name, code")
          .eq("syllabus_code", "V2027")
          .eq("is_active", true)
          .order("sequence", { ascending: true })
          .limit(12);

        if (!cancelled && !error && data) {
          setTopics(data);
        }
      } catch {
        // Optional screen — never block onboarding on failure.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTopics();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTopic(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function handleContinue() {
    setInterestTopicIds(selected);
    router.push("/onboarding/first-question");
  }

  function handleSkip() {
    setInterestTopicIds([]);
    router.push("/onboarding/first-question");
  }

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-2xl font-bold text-navy">What would you like to focus on?</h1>
      <p className="mt-2 text-navy/70">
        Pick any topics that interest you, or skip to try a mix of questions.
      </p>

      {loading ? (
        <div className="mt-8 space-y-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-sky/40"
            />
          ))}
        </div>
      ) : topics.length > 0 ? (
        <ul className="mt-8 space-y-2">
          {topics.map((topic) => {
            const isSelected = selected.includes(topic.id);
            return (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => toggleTopic(topic.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? "border-royal bg-sky/50 text-navy"
                      : "border-navy/10 text-navy/80 hover:bg-sky/30"
                  }`}
                >
                  <span>{topic.name}</span>
                  <span className="text-xs text-navy/50">{topic.code}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 rounded-xl border border-navy/10 bg-sky/30 px-4 py-3 text-sm text-navy/70">
          Topics could not be loaded right now. You can continue with a general mix of
          questions.
        </p>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button type="button" size="lg" onClick={handleContinue}>
          {selected.length > 0 ? "Continue" : "Show me everything"}
        </Button>
        {topics.length > 0 ? (
          <Button type="button" variant="ghost" size="lg" onClick={handleSkip}>
            Skip
          </Button>
        ) : null}
      </div>
    </div>
  );
}
