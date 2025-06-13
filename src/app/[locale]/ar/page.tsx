import React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

// ARコンポーネントはクライアントサイドのみで動作するため、
// サーバーサイドレンダリングを無効化して動的にインポート
const ARViewWithNoSSR = dynamic(() => import("@/components/ar/ARView"), {
  ssr: false,
});

// クライアントコンポーネントをラップする
const ARDisplay = dynamic(() => import("@/components/ar/ARDisplay"), {
  ssr: false,
});

export default function ARPage({ params }: { params: { locale: string } }) {
  return (
    <div className="container mx-auto py-8 pb-24">
      <div className="mb-6">
        <Link
          href={`/${params.locale}/map`}
          className="inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          地図に戻る
        </Link>
        <h1 className="text-3xl font-bold mt-2 mb-4">AR位置情報表示</h1>
        <p className="text-muted-foreground mb-6">
          周囲の実際の景色にARで位置情報を重ねて表示します。
          スマートフォンを向けた方向に相手がいる場合、マーカーが表示されます。
        </p>
      </div>

      {/* AR表示エリア - デモモードを有効にして固定距離問題を確認 */}
      <ARDisplay showDemoMode={true} />

      {/* 使い方ガイド */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>ARモードの使い方</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary/10 p-2 rounded-full mr-4">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">デバイスを目的地に向ける</h3>
                <p className="text-sm text-muted-foreground">
                  スマートフォンのカメラを目的地の方向に向けると、
                  画面上に相手の位置が表示されます。
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary/10 p-2 rounded-full mr-4">
                <span className="block h-5 w-5 text-center font-medium text-primary">
                  2
                </span>
              </div>
              <div>
                <h3 className="font-medium mb-1">距離と方向を確認</h3>
                <p className="text-sm text-muted-foreground">
                  マーカーには目的地までの距離と名前が表示されます。
                  画面外の場合は矢印で方向を示します。
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-primary/10 p-2 rounded-full mr-4">
                <span className="block h-5 w-5 text-center font-medium text-primary">
                  3
                </span>
              </div>
              <div>
                <h3 className="font-medium mb-1">許可が必要です</h3>
                <p className="text-sm text-muted-foreground">
                  カメラ、位置情報、デバイスの向きへのアクセスを許可してください。
                  これらはAR表示に必要です。
                </p>
              </div>
            </div>

            {/* デモモード案内 */}
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start">
                <div className="bg-yellow-400/20 p-2 rounded-full mr-3">
                  <span className="block h-4 w-4 text-center font-bold text-yellow-600 dark:text-yellow-400 text-xs">
                    🧪
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                    デモモード
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    このページではテスト用に現在地から北に100mの位置をターゲットとして表示します。
                    実際の共有位置情報を使用するには、共有コードでアクセスしてください。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
