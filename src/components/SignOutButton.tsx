"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // パスからロケールを抽出
  const getLocaleFromPath = (): string => {
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment === "en" || firstSegment === "ja") {
      return firstSegment;
    }

    return "ja";
  };

  const locale = getLocaleFromPath();

  const handleSignOut = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error("サインアウトに失敗しました: " + error.message);
        console.error("サインアウトエラー:", error);
      } else {
        toast.success("サインアウトしました");
        // サインインページにリダイレクト
        router.push(`/${locale}/sign-in`);
      }
    } catch (error) {
      console.error("サインアウト処理中にエラーが発生しました:", error);
      toast.error("予期せぬエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          サインアウト中...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          サインアウト
        </>
      )}
    </Button>
  );
}
