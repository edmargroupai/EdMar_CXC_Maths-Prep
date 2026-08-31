export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export const appNavItems: NavItem[] = [
  { href: "/home", label: "Dashboard", icon: "▦" },
  { href: "/diagnostic", label: "Diagnostic", icon: "◎" },
  { href: "/practice", label: "Practice", icon: "✎" },
  { href: "/simulate", label: "Exam Simulation", icon: "⏱" },
  { href: "/progress", label: "Progress", icon: "↗" },
];

export const skillSummaries = [
  { name: "Algebra", progress: 72 },
  { name: "Number & Sets", progress: 58 },
  { name: "Geometry", progress: 41 },
  { name: "Statistics", progress: 65 },
  { name: "Consumer Arithmetic", progress: 80 },
] as const;

export const recommendations = [
  {
    id: "rec-1",
    title: "Linear equations",
    reason: "Weak area · 4 marks at stake on Paper 02",
    href: "/practice",
  },
  {
    id: "rec-2",
    title: "Continue Algebra practice",
    reason: "You left off at 6 of 10 questions",
    href: "/practice",
  },
] as const;

export const practiceTopics = [
  { id: "all", name: "All", active: true },
  { id: "algebra", name: "Algebra", active: false },
  { id: "geometry", name: "Geometry", active: false },
  { id: "statistics", name: "Statistics", active: false },
  { id: "consumer", name: "Consumer Arithmetic", active: false },
] as const;

export const practiceCards = [
  {
    id: "linear-equations",
    topic: "Algebra",
    title: "Linear equations",
    progress: 60,
    total: 10,
    completed: 6,
  },
  {
    id: "quadratics",
    topic: "Algebra",
    title: "Quadratic expressions",
    progress: 20,
    total: 8,
    completed: 2,
  },
  {
    id: "sets",
    topic: "Number & Sets",
    title: "Set notation",
    progress: 0,
    total: 12,
    completed: 0,
  },
] as const;

export const recommendedPractice = [
  {
    id: "angles",
    title: "Angles & parallel lines",
    questions: 24,
    mastery: 45,
    href: "/practice",
  },
  {
    id: "probability",
    title: "Probability basics",
    questions: 18,
    mastery: 52,
    href: "/practice",
  },
] as const;

export const examPapers = [
  {
    id: "demo",
    title: "Paper 01 — Multiple Choice",
    form: "Practice mode",
    duration: "1 hr 30 min",
    questions: 50,
    href: "/simulate/demo/q/1",
  },
  {
    id: "p02-demo",
    title: "Paper 02 — Structured",
    form: "Coming soon",
    duration: "2 hr 40 min",
    questions: 8,
    href: "/simulate",
    disabled: true as const,
  },
] as const;

/** Demo MCQ shell only — not real question content. */
export const demoExamQuestion = {
  paperTitle: "Paper 01 — Multiple Choice",
  position: 20,
  total: 50,
  marks: 1,
  stem: "Placeholder stem — real questions load from the content API after P16.",
  options: [
    { key: "A" as const, label: "Option A" },
    { key: "B" as const, label: "Option B" },
    { key: "C" as const, label: "Option C" },
    { key: "D" as const, label: "Option D" },
  ],
};
