import { EmptyState } from "@/components/ui/empty-state";

type PageProps = {
  params: Promise<{ topicId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { topicId } = await params;
  return { title: `Topic ${topicId}` };
}

export default async function TopicProgressPage({ params }: PageProps) {
  const { topicId } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy dark:text-white">Topic progress</h1>
      <p className="mt-1 text-sm text-navy/60 dark:text-white/70">Topic ID: {topicId}</p>
      <div className="mt-8">
        <EmptyState
          title="Objective detail coming soon"
          description="Skill mastery and objective breakdown will appear here after readiness ships."
          actionLabel="Back to progress"
          actionHref="/progress"
        />
      </div>
    </div>
  );
}
