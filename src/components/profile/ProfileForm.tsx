"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/app/actions/profile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/supabase";

// 部分的なユーザー情報の型を定義
interface PartialUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any> | null;
  created_at?: string;
}

interface ProfileFormProps {
  user: User | PartialUser;
  profile?: Profile | null;
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);

  // プロフィール情報のステート
  const [username, setUsername] = useState(profile?.username || "");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_url || user?.user_metadata?.avatar_url || ""
  );

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("display_name", displayName);
      formData.append("avatar_url", avatarUrl);

      const result = await updateProfile(formData);

      if (result.success) {
        toast.success("プロフィールを更新しました");
      } else {
        toast.error(`更新に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      toast.error("プロフィール更新中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ユーザーのイニシャルを取得
  const getUserInitial = () => {
    if (displayName) return displayName[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return "U";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* アバター表示 */}
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="h-24 w-24">
          <AvatarImage
            src={avatarUrl}
            alt={displayName || username || user.email || "ユーザー"}
          />
          <AvatarFallback>{getUserInitial()}</AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">
          アバター画像はOAuth認証情報から取得しています
        </p>
      </div>

      {/* ユーザー名 */}
      <div className="space-y-2">
        <Label htmlFor="username">ユーザー名</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ユーザー名を入力"
        />
        <p className="text-xs text-muted-foreground">
          ユーザー名はアプリ内で表示される識別子です
        </p>
      </div>

      {/* 表示名 */}
      <div className="space-y-2">
        <Label htmlFor="displayName">表示名</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="表示名を入力"
        />
        <p className="text-xs text-muted-foreground">
          表示名はプロフィールやメッセージで使用されます
        </p>
      </div>

      {/* メールアドレス（表示のみ） */}
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input id="email" value={user.email || ""} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          メールアドレスは認証情報から取得しており変更できません
        </p>
      </div>

      {/* 送信ボタン */}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            更新中...
          </>
        ) : (
          "プロフィールを更新"
        )}
      </Button>
    </form>
  );
}
