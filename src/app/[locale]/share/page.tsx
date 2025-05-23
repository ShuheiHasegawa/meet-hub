import React from "react";
import { ensureLocationsTable } from "@/app/actions/setup-locations";
import CreateShareLocation from "@/components/share/CreateShareLocation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import SharedLocationForm from "@/components/location/SharedLocationForm";
import UserLocationList from "@/components/location/UserLocationList";

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

  // デバッグ用：データベース内の位置情報を取得
  let debugLocations = null;

  try {
    const { data, error } = await supabase
      .from("locations")
      .select("share_code, title, created_at, is_active")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      debugLocations = data;
    }
  } catch (error) {
    console.error("デバッグ用位置情報取得エラー:", error);
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：位置共有フォーム */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">位置を共有する</h2>
              <CreateShareLocation />
            </div>
          </div>

          {/* 右側：共有位置検索フォーム */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">共有位置を検索</h2>
              <SharedLocationForm />
            </div>

            {/* デバッグ情報 - Vercel環境でも表示 */}
            {debugLocations && (
              <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">
                  デバッグ: 最近の共有コード（コピーして使用可能）
                </h3>
                <div className="text-xs space-y-1">
                  {debugLocations.map((loc, index) => (
                    <div key={index} className="flex justify-between">
                      <button
                        className="font-mono text-left hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded"
                        onClick={() => {
                          navigator.clipboard.writeText(loc.share_code);
                          alert(
                            `共有コード "${loc.share_code}" をコピーしました`
                          );
                        }}
                      >
                        {loc.share_code}
                      </button>
                      <span
                        className={
                          loc.is_active ? "text-green-600" : "text-red-600"
                        }
                      >
                        {loc.is_active ? "有効" : "無効"}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ↑ 共有コードをクリックするとコピーされます
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 自分の共有位置リスト */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">自分の共有位置</h2>
        <UserLocationList />
      </div>
    </div>
  );
}
