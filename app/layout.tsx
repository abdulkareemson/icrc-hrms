// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ICRC HRMS",
    template: "%s | ICRC HRMS",
  },
  description:
    "Human Resource Management System for the Infrastructure Concession Regulatory Commission, Nigeria",
  keywords: ["ICRC", "HRMS", "Nigeria", "Human Resource", "PPP"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="top-right" richColors closeButton duration={5000} />
      </body>
    </html>
  );
}
