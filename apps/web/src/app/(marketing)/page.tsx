import { FeaturesSection } from "@/components/marketing/features-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { StatsBar } from "@/components/marketing/stats-bar";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
    </>
  );
}
