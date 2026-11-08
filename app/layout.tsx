import type { Metadata } from "next";
import { Newsreader, Inter_Tight } from "next/font/google";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif" });
const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = { title: "Notebook", description: "A markdown-powered blog." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
