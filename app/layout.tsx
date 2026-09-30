import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
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
        <header className="border-b">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <a href="/" className="font-bold">💒 Gift & Wedding</a>
            <div className="flex items-center gap-4 text-sm">
              <a href="/dashboard">Dashboard</a>
              <a href="/dashboard/billing">Billing</a>
              <a href="/admin/templates">Admin</a>
              <a href="/login" className="rounded-lg bg-neutral-900 px-3 py-1.5 text-white">Login</a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
