import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./hospital-workflow.css";
import { AuthProvider } from "@/features/auth/auth-context";
import { Toaster } from "sonner";

const dmSans = localFont({
  src: "../../public/fonts/dm-sans.woff2",
  variable: "--font-dm-sans",
  display: "swap",
  weight: "100 1000",
});

export const metadata: Metadata = {
  title: "MediStock · A little more care",
  description:
    "Connected hospital care. Reception, consultations, pharmacy and online appointments in one thoughtful workspace.",
  icons: { icon: "/hospital-mark.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${dmSans.variable} h-full antialiased`}>
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors theme="light" />
        </AuthProvider>
      </body>
    </html>
  );
}
