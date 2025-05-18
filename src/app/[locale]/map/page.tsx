import React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Share2, Eye } from "lucide-react";

// Leafletはブラウザのウィンドウオブジェクトに依存するため、
// サーバーサイドレンダリングを無効にする必要がある
const LocationMapWithNoSSR = dynamic(
  () => import("@/components/map/LocationMap"),
  { ssr: false }
);

// 位置情報フォームもクライアントサイドのみの機能
const MapControllerWithNoSSR = dynamic(
  () => import("@/components/map/MapController"),
  { ssr: false }
);

export default function MapPage({ params }: { params: { locale: string } }) {
  return (
    <div className="container mx-auto py-8 pb-24">
      <h1 className="text-3xl font-bold mb-6">位置情報マップ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 地図 */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 h-full">
            {/* 地図コンポーネント */}
            <LocationMapWithNoSSR height="500px" />
          </div>
        </div>

        {/* 右側: 操作パネル */}
        <div className="space-y-6">
          {/* 共有コード入力 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">位置情報を検索</CardTitle>
              <CardDescription>
                共有された位置情報の共有コードを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapControllerWithNoSSR />
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/${params.locale}/share`}>
              <Button className="w-full" variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                位置を共有
              </Button>
            </Link>
            <Link href={`/${params.locale}/ar`}>
              <Button className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                AR表示
              </Button>
            </Link>
          </div>

          {/* 使い方ガイド */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">マップの使い方</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• マップ上でドラッグして移動</li>
                <li>• ダブルクリックまたはピンチでズーム</li>
                <li>• マーカーをクリックして詳細を表示</li>
                <li>• 「位置情報を更新」で現在地を再取得</li>
                <li>• 共有コードを入力して位置を表示</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
