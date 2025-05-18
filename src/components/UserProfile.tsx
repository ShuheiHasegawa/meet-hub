"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

interface UserProfileProps {
  user: SupabaseUser | null;
  // profile?: any; // 必要に応じてプロファイル情報の型定義を追加
}

export default function UserProfile({ user }: UserProfileProps) {
  const router = useRouter();
  const pathname = usePathname();

  // パスからロケールを抽出
  const getLocaleFromPath = (): string => {
    // パスから最初のセグメントを取得（例：/ja/sign-in から ja を取得）
    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];

    // 最初のセグメントが有効なロケールであれば、それを使用
    if (firstSegment === "en" || firstSegment === "ja") {
      return firstSegment;
    }

    // デフォルトロケールを返す
    return "ja";
  };

  const locale = getLocaleFromPath();

  // プロフィールページへの遷移
  const navigateToProfile = () => {
    // リダイレクト先パスのログを出力
    const profilePath = `/${locale}/profile`;
    console.log("[UserProfile] プロフィールページへ遷移:", {
      locale,
      currentPath: pathname,
      destinationPath: profilePath,
    });

    // 現在のURLにpathname含まれていたらそのままにする（再読み込みしない）
    if (pathname.includes("/profile")) {
      console.log(
        "[UserProfile] 既にプロフィールページにいるため、遷移をスキップします"
      );
      return;
    }

    // プロフィールページに遷移
    router.push(profilePath);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("サインアウトエラー:", error);
        toast.error("サインアウトに失敗しました: " + error.message);
      } else {
        toast.success("サインアウトしました");
        // サインインページにリダイレクト
        router.push(`/${locale}/sign-in`);
      }
    } catch (error) {
      console.error("サインアウトエラー:", error);
      toast.error("予期せぬエラーが発生しました");
    }
  };

  if (!user) {
    // This case should ideally be handled by the Header:
    // if no user, it might show AuthButtons instead of UserProfile.
    // For now, return null or a sign-in prompt if UserProfile is rendered directly without a user.
    return null;
  }

  const userEmail = user.email || "";
  const userNameInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";
  // const userDisplayName = profile?.username || user.email;
  // const userAvatarUrl = profile?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {/* <AvatarImage src={userAvatarUrl} alt={userDisplayName} /> */}
            <AvatarImage
              src={user.user_metadata?.avatar_url || undefined}
              alt={user.user_metadata?.name || user.email || "User"}
            />
            <AvatarFallback>
              {user.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.user_metadata?.name || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={navigateToProfile}>
          <User className="mr-2 h-4 w-4" />
          プロフィール設定
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          サインアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
