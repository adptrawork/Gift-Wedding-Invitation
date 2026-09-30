import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Gift & Wedding Invitation Platform",
  description: "Platform SaaS undangan digital Wedding + Gift dengan Template Engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
