"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import ARView from "./ARView";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { GeoPosition } from "@/types/location";

export default function ARDisplay() {
  // 現在の位置情報を取得
  const {
    position: currentPosition,
    loading: positionLoading,
    error: positionError,
    getCurrentPosition,
  } = useGeolocation();

  // サンプル用ターゲット位置（実際にはAPI呼び出しやDBから取得する）
  const [targetPosition, setTargetPosition] = useState<GeoPosition | null>(
    null
  );
  const [targetName, setTargetName] = useState("待ち合わせ場所");

  // コンポーネント初期化時に位置情報を取得
  useEffect(() => {
    console.log("[ARDisplay] コンポーネント初期化 - 位置情報取得を開始");
    getCurrentPosition();
  }, [getCurrentPosition]);

  // 位置情報取得状況をログ出力
  useEffect(() => {
    console.log("[ARDisplay] 位置情報状況:", {
      loading: positionLoading,
      hasPosition: !!currentPosition,
      error: positionError,
      geolocationSupported: !!navigator.geolocation,
    });
  }, [positionLoading, currentPosition, positionError]);

  // ダミーデータの生成（デモ用）
  // 実際のアプリでは共有コードなどから取得した実際の位置情報を使用する
  useEffect(() => {
    if (!currentPosition) return;

    // 現在地から少し離れた位置をダミーターゲットとして設定
    // 北に約100メートル
    const offsetLat = 100 / 111111; // 緯度1度は約111111メートル
    const offsetLng =
      100 / (111111 * Math.cos(currentPosition.latitude * (Math.PI / 180)));

    setTargetPosition({
      latitude: currentPosition.latitude + offsetLat,
      longitude: currentPosition.longitude + offsetLng,
    });
  }, [currentPosition]);

  // 位置情報を更新
  const handleRefreshLocation = () => {
    getCurrentPosition();
  };

  // 位置情報が取得できているかチェック
  if (positionError) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
        <h3 className="font-bold mb-2">位置情報の取得に失敗しました</h3>
        <p className="mb-3">{positionError}</p>

        {/* 詳細なガイダンス */}
        <div className="text-sm mb-4 space-y-2">
          <p>
            <strong>解決方法:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>ブラウザのアドレスバーの🔒マークをクリック</li>
            <li>位置情報を「許可」に設定</li>
            <li>ページを再読み込み</li>
            <li>HTTPSサイトでアクセスしているか確認</li>
          </ul>
        </div>

        <Button
          className="mt-4"
          variant="outline"
          onClick={handleRefreshLocation}
        >
          <RefreshCcw className="h-4 w-4 mr-2" /> 再取得
        </Button>
      </div>
    );
  }

  if (positionLoading || !currentPosition) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-300 text-center">
        <p className="mb-2">位置情報を取得しています...</p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <ARView
          currentPosition={currentPosition}
          targetPosition={targetPosition || undefined}
          targetName={targetName}
        />

        {/* 更新ボタン */}
        <Button
          className="absolute top-4 right-4 z-10"
          size="sm"
          variant="secondary"
          onClick={handleRefreshLocation}
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          更新
        </Button>
      </div>

      {/* 現在地情報 */}
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h3 className="font-medium mb-2">現在地情報</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">緯度:</span>{" "}
            {currentPosition.latitude.toFixed(6)}
          </div>
          <div>
            <span className="text-muted-foreground">経度:</span>{" "}
            {currentPosition.longitude.toFixed(6)}
          </div>
          {currentPosition.accuracy && (
            <div className="col-span-2">
              <span className="text-muted-foreground">精度:</span>{" "}
              {currentPosition.accuracy.toFixed(1)}m
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
