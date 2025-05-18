import React from "react";
import { ensureLocationsTable } from "@/app/actions/setup-locations";
import CreateShareLocation from "@/components/share/CreateShareLocation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface SharePageProps {
  params: {
    locale: string;
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { locale } = params;

  // サーバーサイドでユーザー認証状態を確認
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未認証の場合はサインインページにリダイレクト
  if (!user) {
    // ロケールを含むパスにリダイレクト
    redirect(`/${locale}/sign-in`);
  }

  // 位置情報テーブルの確認
  const { success, error } = await ensureLocationsTable();

  // 開発モードでのみデバッグ情報を表示
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">位置情報の共有</h1>

      {isDev && (
        <Alert className="mb-4">
          <AlertTitle>開発モード情報</AlertTitle>
          <AlertDescription className="text-sm">
            <div>
              ユーザー: {user.email} (ID: {user.id.slice(0, 8)}...)
            </div>
            <div>テーブル状態: {success ? "✅ OK" : "❌ エラー"}</div>
            <div>環境: {process.env.NODE_ENV}</div>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <p className="text-lg text-muted-foreground">
          現在地を共有して待ち合わせをスムーズに。共有リンクを送るだけで、相手はARマーカーでわかりやすく目的地を確認できます。
        </p>
      </div>

      {!success && error ? (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>データベースエラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="lg:max-w-3xl mx-auto">
          <CreateShareLocation />
        </div>
      )}
    </div>
  );
}
