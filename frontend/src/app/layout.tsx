import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SparklesCore } from "@/components/sparkles";
import Navbar from "@/components/navbar";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GiG_Economy",
  description:
    "Leverage our decentralized platform to streamline task creation, assignment, and verification – powered by the Arbitrum Blockchain",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProvider cookies={cookies}>
          <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden">
            {/* Ambient background with moving particles */}
            <div className="h-full w-full absolute inset-0 z-0">
              <SparklesCore
                id="tsparticlesfullpage"
                background="transparent"
                minSize={0.6}
                maxSize={1.4}
                particleDensity={100}
                className="w-full h-full"
                particleColor="#FFFFFF"
              />
            </div>

            <div className="relative z-10">
              <Navbar />
              {children}
            </div>
          </main>
          <Toaster richColors />
        </ContextProvider>
      </body>
    </html>
  );
}
