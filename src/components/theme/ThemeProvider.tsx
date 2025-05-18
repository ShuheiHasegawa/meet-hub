"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import React from "react";

// 簡易化した型定義を使用
export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  [prop: string]: any;
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
