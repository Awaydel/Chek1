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
  title: "Дашборд by А.Б",
  description: "Интерактивная панель мониторинга и анализа данных. Разработано с использованием TypeScript, Tailwind CSS и shadcn/ui.",
  keywords: ["Дашборд", "Аналитика", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "React"],
  authors: [{ name: "Бурнаев А.В" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Дашборд by А.Б",
    description: "Интерактивная панель мониторинга и анализа данных",
    url: "https://chek1-production.up.railway.app",
    siteName: "Дашборд аналитики",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Дашборд by А.Б",
    description: "Интерактивная панель мониторинга и анализа данных",
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
