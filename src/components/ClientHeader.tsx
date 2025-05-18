"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserProfile from "@/components/UserProfile";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";
import { ThemeToggle } from "./theme/ThemeToggle";

export default function ClientHeader({ locale }: { locale: Locale }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        console.log("ClientHeader: ユーザー情報取得成功");
        setUser(data.user);
      } else {
        console.log(
          "ClientHeader: ユーザー未ログインまたはエラー",
          error?.message
        );
      }
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("ClientHeader: 認証状態変更", event);
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="font-bold text-xl">MeetHub</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <UserProfile user={user} />
          ) : (
            <Link href={`/${locale}/sign-in`}>
              <Button variant="outline" size="sm">
                サインイン
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
