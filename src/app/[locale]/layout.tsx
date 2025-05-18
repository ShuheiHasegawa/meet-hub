import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import React from "react";
import { i18n, Locale } from "@/lib/i18n";
import ClientHeader from "@/components/ClientHeader"; // クライアントサイドヘッダーに変更
import SupabaseSessionInit from "@/components/_init";
import DebugAuthStatus from "@/components/DebugAuthStatus";
import { Toaster } from "sonner";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: "MeetHub",
  description: "AR Location Sharing Service",
};

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: Locale };
}>) {
  return (
    <html lang={params.locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseSessionInit />
          <ClientHeader locale={params.locale} />
          <main className="pb-16">{children}</main>
          <BottomNavigation locale={params.locale} />
          <Toaster position="top-center" />
          {/* <DebugAuthStatus /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
