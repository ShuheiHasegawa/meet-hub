import { notFound } from "next/navigation";
import SharedLocationView from "@/components/location/SharedLocationView";
import { ensureLocationsTable } from "@/app/actions/setup-locations";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { getLocationByShareCode } from "@/app/actions/location";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, Clock, AlertTriangle, Ban } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SharedLocationPageProps {
  params: {
    code: string;
  };
}

export default async function SharedLocationPage({
  params,
}: SharedLocationPageProps) {
  const { code } = params;
  console.log("共有ページにアクセス - コード:", code);

  // 位置情報テーブルの確認
  const { success: tableExists, error: tableError } =
    await ensureLocationsTable();

  // テーブルが存在しない場合はエラーを表示
  if (!tableExists) {
    console.error("テーブル確認エラー:", tableError);
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">共有位置情報</h1>

        <Alert variant="destructive">
          <AlertTitle>データベースエラー</AlertTitle>
          <AlertDescription>{tableError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Supabaseクライアントを作成
  const supabase = createClient();

  // 位置情報の取得
  try {
    console.log("共有コードからの位置情報取得開始:", code);
    const response = await getLocationByShareCode(code);
    console.log("位置情報取得結果:", {
      success: response?.success,
      hasData: response?.data ? true : false,
      error: response?.error || null,
    });

    if (!response || !response.success || !response.data) {
      console.error("位置情報取得失敗:", response?.error || "不明なエラー");
      // 位置情報が見つからない場合
      return (
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold">位置情報が見つかりません</h2>
            <p className="text-muted-foreground mt-2">
              指定された共有コードの位置情報は見つかりませんでした。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              以下の理由が考えられます：
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>共有コードが間違っている</li>
              <li>位置情報の共有が削除された</li>
              <li>位置情報の共有期限が切れている</li>
            </ul>
            <div className="mt-6 flex justify-center">
              <Link href="/share" passHref>
                <Button variant="outline">戻る</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 位置情報が見つかった場合
    const location = response.data;
    console.log("位置情報詳細:", {
      id: location.id,
      is_active: location.is_active,
      expires_at: location.expires_at,
    });

    // 非アクティブ状態をチェック
    if (location.is_active === false) {
      console.log("非アクティブな共有:", location.id);
      return (
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <Ban className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold">共有が停止されています</h2>
            <p className="text-muted-foreground mt-2">
              この位置情報の共有は停止されています。
            </p>
          </CardHeader>
          <CardContent>
            <div className="mt-6 flex justify-center">
              <Link href="/share" passHref>
                <Button variant="outline">戻る</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 有効期限をチェック
    const expiresAt = new Date(location.expires_at);
    const now = new Date();
    console.log("有効期限チェック:", {
      expires: expiresAt.toISOString(),
      now: now.toISOString(),
      isExpired: expiresAt < now,
    });

    if (expiresAt < now) {
      console.log("期限切れの共有:", location.id);
      return (
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader className="text-center">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold">共有期限切れ</h2>
            <p className="text-muted-foreground mt-2">
              この位置情報の共有期限は切れています。
            </p>
          </CardHeader>
          <CardContent>
            <div className="mt-6 flex justify-center">
              <Link href="/share" passHref>
                <Button variant="outline">戻る</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }

    // SharedLocation型からLocation型へのマッピング
    const locationForView = {
      id: location.id,
      user_id: location.user_id,
      share_code: location.share_code,
      title: location.title || "共有位置情報",
      description: location.description || "位置情報が共有されています",
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude || null,
      accuracy: location.accuracy || null,
      heading: location.heading || null,
      is_active: true,
      expires_at: location.expires_at,
      created_at: location.created_at,
      updated_at: location.updated_at || location.created_at,
    };

    console.log("表示用データ準備完了:", locationForView.id);

    // 有効な共有位置情報を表示
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">共有位置情報</h1>

        <SharedLocationView location={locationForView} shareCode={code} />
      </div>
    );
  } catch (error) {
    console.error("位置情報取得エラー:", error);
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardHeader className="text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">エラーが発生しました</h2>
          <p className="text-muted-foreground mt-2">
            位置情報の取得中にエラーが発生しました。
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-3 rounded text-sm mb-4 overflow-auto">
            <pre>{(error as Error).message}</pre>
          </div>
          <div className="mt-6 flex justify-center">
            <Link href="/share" passHref>
              <Button variant="outline">戻る</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
}
