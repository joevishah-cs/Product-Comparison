import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daikin Competitive Marketing Intelligence",
  description: "AI-powered product positioning and competitive intelligence for Daikin Marketing.",
  openGraph: { title: "Daikin Competitive Marketing Intelligence", description: "Compare. Position. Win.", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "Daikin Competitive Marketing Intelligence", description: "Compare. Position. Win.", images: ["/og.png"] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
