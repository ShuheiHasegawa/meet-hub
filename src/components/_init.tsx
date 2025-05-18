"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";

// このコンポーネントは、クライアントサイドでSupabaseセッションを初期化する役割を持ちます
export default function SupabaseSessionInit() {
  const router = useRouter();
  const pathname = usePathname();

  // 認証状態の変化を監視
  useEffect(() => {
    // ログ出力
    console.log("[SessionInit] 初期化 - 現在のパス:", pathname);

    // セッション状態を確認
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("[SessionInit] セッション確認エラー:", error.message);
          return;
        }

        const hasSession = !!data.session;
        const expiresAt = data.session?.expires_at
          ? new Date(data.session.expires_at * 1000)
          : null;

        // 有効期限を確認
        const now = new Date();
        const expiresIn = expiresAt
          ? Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
          : null;

        console.log("[SessionInit] セッション状態:", {
          hasSession,
          expiresIn: expiresIn ? `${expiresIn}秒後` : "不明",
          userId: data.session?.user.id,
        });

        // セッションの期限が近づいていたら更新
        if (hasSession && expiresIn && expiresIn < 3600) {
          // 1時間未満
          console.log("[SessionInit] セッション期限が近いため更新を試みます");
          await supabase.auth.refreshSession();
        }
      } catch (e) {
        console.error("[SessionInit] 予期せぬエラー:", e);
      }
    };

    checkSession();

    // 認証状態変更イベントのリスナー
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[SessionInit] 認証状態変更:", {
        event,
        hasSession: !!session,
        userId: session?.user.id,
      });

      if (event === "SIGNED_IN") {
        // サインイン時、現在のパスがsign-inなら、ホームページへリダイレクト
        if (pathname.includes("sign-in")) {
          const locale = pathname.split("/")[1] || "ja";
          router.push(`/${locale}`);
        } else {
          // 現在のページを更新
          router.refresh();
        }
      } else if (event === "SIGNED_OUT") {
        // サインアウト時、現在のページを更新
        router.refresh();
      } else if (event === "TOKEN_REFRESHED") {
        console.log("[SessionInit] トークン更新完了");
      }
    });

    // コンポーネントのアンマウント時にリスナーを削除
    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // ページ表示には影響を与えないコンポーネント
  return null;
}
