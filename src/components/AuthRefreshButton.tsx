"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthRefreshButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const refreshSession = async () => {
    setLoading(true);
    try {
      // 既存のセッションを取得
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("有効なセッションがありません。再度ログインしてください。");
        return;
      }

      // セッションの更新を試みる
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        toast.error("セッションの更新に失敗しました: " + error.message);
        return;
      }

      toast.success("セッションを更新しました");

      // ページをリフレッシュして新しいセッションで再ロード
      router.refresh();

      // 少し待ってからページをリロード
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("セッション更新エラー:", error);
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={refreshSession}
      disabled={loading}
      className="flex items-center gap-1"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "更新中..." : "セッションを更新"}
    </Button>
  );
}
