import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/auth-context";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MediStock · Clinic & OPD Management System",
  description:
    "Minimalist healthcare SaaS for clinic operations, doctor consultation desk, smart OPD queues, and BIR-compliant billing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fbfbfb] text-[#09090b] font-sans">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors theme="light" />
        </AuthProvider>
      </body>
    </html>
  );
}
