import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins, Lato } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { Toaster } from "react-hot-toast";
import { ClerkProvider, SignedIn } from '@clerk/nextjs';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // choose weights you need
  variable: "--font-poppins",           // CSS variable for Tailwind
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "Spin Cycle Laundro-App",
  description: "Spin Cycle is a modern, cloud‑based point‑of‑sale and management platform built specifically for laundromats. Designed with simplicity and scalability in mind, it helps owners and staff streamline daily operations while keeping everything accessible from any device.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <ClerkProvider>
          {/* Header with logo and divider */}
          <Header />
          <main className="flex-1">{children}</main>
          <SignedIn>
            <BottomNav />
          </SignedIn>
          <Toaster position="top-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
