import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Nav } from "@/components/Nav";
import { AppToastProvider } from "@/components/ToastProvider";
import { getSessionUser } from "@/lib/auth";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TJ Pantry — Trader Joe's tracker",
  description:
    "Import receipts, rate finds, build grocery lists, and track your Trader Joe's stores.",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AppToastProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Nav displayName={user?.displayName} />
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
        </AppToastProvider>
      </body>
    </html>
  );
}
