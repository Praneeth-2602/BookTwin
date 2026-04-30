import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookTwin — Find your perfect book",
  description: "AI book recommendations powered by LangGraph + Groq",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-mono min-h-screen relative z-10">{children}</body>
    </html>
  );
}
