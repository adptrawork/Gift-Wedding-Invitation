import type { Metadata } from "next";
import "./globals.css";
import { Inter, Cormorant_Infant, Great_Vibes } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const cormorant = Cormorant_Infant({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-cormorant" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-great-vibes" });

export const metadata: Metadata = {
  title: "Gift & Wedding Invitation Platform",
  description: "Platform SaaS undangan digital Wedding + Gift dengan Template Engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable, cormorant.variable, greatVibes.variable)}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
