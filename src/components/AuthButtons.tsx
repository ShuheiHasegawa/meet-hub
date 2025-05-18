"use client";

import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { i18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// 型安全のためのリテラル
const LOCALES = ["en", "ja"] as const;
type SupportedLocale = (typeof LOCALES)[number];
const DEFAULT_LOCALE = "ja" as const;

export default function AuthButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // パスからロケールを抽出
  const getLocaleFromPath = () => {
    // パスから最初のセグメントを取得（例：/ja/sign-in から ja を取得）
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    // 最初のセグメントが有効なロケールであれば、それを使用
    if (firstSegment === "en" || firstSegment === "ja") {
      return firstSegment;
    }

    // デフォルトロケールを返す
    return DEFAULT_LOCALE;
  };

  const locale = getLocaleFromPath();

  // コンポーネントマウント時にセッションを確認
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("[AuthButtons] セッション確認:", {
        hasSession: !!data?.session,
        sessionExpires: data?.session?.expires_at
          ? new Date(data.session.expires_at * 1000).toLocaleString()
          : undefined,
        error: error?.message,
      });

      // すでにセッションがある場合はホームページにリダイレクト
      if (data?.session) {
        router.push(`/${locale}`);
      }
    };

    checkSession();
  }, [router, locale]);

  const handleSignIn = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline", // リフレッシュトークンを取得するために必要
            prompt: "consent", // 常に同意画面を表示し、リフレッシュトークンを取得
          },
        },
      });

      if (error) {
        console.error("サインインエラー:", error);
        toast.error(`サインインに失敗しました: ${error.message}`);
        setLoading(false);
        return;
      }

      // サインインが成功した場合、データはここでは利用できない（リダイレクトするため）
      console.log("[AuthButtons] OAuth認証開始:", {
        provider: "google",
        success: !!data.url,
      });

      // リダイレクトは自動的に行われるため、ここでは何もしない
    } catch (error) {
      console.error("予期せぬエラー:", error);
      toast.error("サインイン処理中にエラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center w-full">
      <Button
        onClick={handleSignIn}
        disabled={loading}
        className="flex items-center gap-2 px-6"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            サインイン中...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 48 48"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              ></path>
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              ></path>
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
            </svg>
            Googleでサインイン
          </>
        )}
      </Button>
    </div>
  );
}
