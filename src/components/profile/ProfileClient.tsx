"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/profile/useProfile";
import { Profile } from "@/types/supabase";
import { usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "@/components/profile/ProfileForm";
import { Loader2 } from "lucide-react";
import AuthRefreshButton from "@/components/AuthRefreshButton";
import ErrorCard from "@/components/ErrorCard";
import SignOutButton from "@/components/SignOutButton";

export default function ProfileClient({
  initialProfile,
}: {
  initialProfile: Profile | null;
}) {
  const { user, profile, loading } = useProfile(initialProfile);
  const pathname = usePathname();
  const locale = pathname.split("/")[1]; // パスからロケールを取得

  const [showDebugInfo] = useState(process.env.NODE_ENV === "development");

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証情報があるかどうか
  const isAuthenticated = !!user;
  const hasSession = !!user;

  return (
    <div className="container mx-auto py-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">アカウント設定</h1>
        {/* 認証セッション更新ボタン */}
        <AuthRefreshButton />
      </div>

      {/* 認証エラーデバッグ情報 */}
      {showDebugInfo && !isAuthenticated && (
        <ErrorCard
          title="認証エラー"
          description="認証状態の問題が検出されました。以下の情報を確認してください。"
          debugInfo={{
            isAuthenticated,
            hasUser: !!user,
            hasProfile: !!profile,
            redirectDisabled: true,
          }}
          redirectUrl={`/${locale}/sign-in`}
        />
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">プロフィール</TabsTrigger>
          <TabsTrigger value="about">アプリについて</TabsTrigger>
          {showDebugInfo && (
            <TabsTrigger value="debug">デバッグ情報</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>プロフィール情報</CardTitle>
              {!hasSession && (
                <CardDescription className="text-amber-600">
                  ⚠️
                  認証セッションが取得できません。「セッションを更新」ボタンをクリックしてください。
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {hasSession ? (
                <ProfileForm user={user!} profile={profile} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    認証セッションの更新が必要です
                  </p>
                  <div className="mt-4">
                    <AuthRefreshButton />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>アカウント情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">メールアドレス:</span>{" "}
                  {user?.email || "不明"}
                </div>
                <div>
                  <span className="text-muted-foreground">ユーザーID:</span>{" "}
                  {user?.id || "不明"}
                </div>
                <div>
                  <span className="text-muted-foreground">
                    アカウント作成日:
                  </span>{" "}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("ja-JP")
                    : "不明"}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <SignOutButton />
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>MeetHubについて</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  MeetHubは、ARを活用した位置情報共有サービスです。
                  待ち合わせをよりスムーズにするために開発されました。
                </p>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">バージョン:</span> 1.0.0
                  </p>
                  <p>
                    <span className="font-medium">開発者:</span> MeetHub Team
                  </p>
                  <p>
                    <span className="font-medium">技術スタック:</span> Next.js,
                    Supabase, WebXR, React
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showDebugInfo && (
          <TabsContent value="debug">
            <Card>
              <CardHeader>
                <CardTitle>認証ステータス</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(
                    {
                      authenticated: isAuthenticated,
                      userId: user?.id,
                    },
                    null,
                    2
                  )}
                </pre>
                <div className="mt-4">
                  <p className="font-medium mb-2">ユーザー情報:</p>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(
                      user
                        ? {
                            id: user.id,
                            email: user.email,
                            created_at: user.created_at,
                          }
                        : null,
                      null,
                      2
                    )}
                  </pre>
                </div>
                <div className="mt-4">
                  <p className="font-medium mb-2">プロフィール情報:</p>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
                <div className="mt-4">
                  <p className="font-medium mb-2">パス情報:</p>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify({ locale }, null, 2)}
                  </pre>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-end">
                  <AuthRefreshButton />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
