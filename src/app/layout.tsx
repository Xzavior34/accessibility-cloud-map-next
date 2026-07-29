import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accessibility Map — powered by accessibility.cloud",
  description:
    "Wheelchair-accessible places map built on Accessibility Cloud (Sozialhelden e.V.) — a prototype iteration for evaluating this data source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
