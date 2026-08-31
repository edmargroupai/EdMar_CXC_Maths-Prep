import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { OfflineBanner } from "@/components/ui/offline-banner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "EdMar CXC Maths",
    template: "%s · EdMar CXC Maths",
  },
  description:
    "Built for Caribbean students. Aligned to the CXC syllabus. Diagnostic, practice, and exam simulation.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <AppProviders>
          <OfflineBanner />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
