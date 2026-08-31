import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EdMar Admin",
  description: "Content review, publishing, and calibration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        {children}
      </body>
    </html>
  );
}
