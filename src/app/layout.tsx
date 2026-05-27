import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Analytics Dashboard by A.B.",
  description: "Interactive data monitoring and analysis dashboard. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Dashboard", "Analytics", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "React"],
  authors: [{ name: "A.V. Burnaev" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Analytics Dashboard by A.B.",
    description: "Interactive data monitoring and analysis dashboard",
    url: "https://chek1-production.up.railway.app",
    siteName: "Analytics Dashboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Analytics Dashboard by A.B.",
    description: "Interactive data monitoring and analysis dashboard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
