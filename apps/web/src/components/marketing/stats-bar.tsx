const stats = [
  { value: "12K+", label: "Students Empowered" },
  { value: "1,500+", label: "Practice Questions" },
  { value: "200+", label: "Video Lessons" },
  { value: "98%", label: "Recommend EdMar" },
] as const;

export function StatsBar() {
  return (
    <section
      aria-label="Platform statistics"
      className="bg-navy py-8 text-white"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-bold text-gold sm:text-3xl">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-white/80 sm:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
