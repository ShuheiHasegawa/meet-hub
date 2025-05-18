"use client";

import { useEffect, useRef, useState } from "react";
import { useAR } from "@/hooks/ar/useAR";
import { GeoPosition } from "@/types/location";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Compass, MapPin } from "lucide-react";

interface ARViewProps {
  targetPosition?: GeoPosition;
  currentPosition?: GeoPosition;
  targetName?: string;
}

export default function ARView({
  targetPosition,
  currentPosition,
  targetName = "目的地",
}: ARViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { initializeAR, isInitialized, isSupported, error, bearing, distance } =
    useAR({
      targetPosition,
      currentPosition,
    });

  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // AR初期化
  useEffect(() => {
    if (
      containerRef.current &&
      videoRef.current &&
      !isInitialized &&
      !permissionRequested
    ) {
      setPermissionRequested(true);
    }
  }, [isInitialized, permissionRequested]);

  // ARモード開始
  const startAR = async () => {
    if (containerRef.current && videoRef.current) {
      try {
        await initializeAR(containerRef.current, videoRef.current);
      } catch (e) {
        console.error("AR初期化エラー:", e);
      }
    }
  };

  // コンパス方向の監視
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // iOS Safari用
      if (
        typeof (DeviceOrientationEvent as any).requestPermission ===
          "function" &&
        !permissionRequested
      ) {
        return;
      }

      // アルファ値（コンパス方向）
      if (event.alpha !== null) {
        setCompassHeading(event.alpha);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [permissionRequested]);

  // 方位差の計算（ターゲットへの方向と現在のデバイス向きの差）
  const getRelativeBearing = () => {
    if (bearing === null || compassHeading === null) return null;

    // ベアリングとコンパス向きの差を計算
    let relativeBearing = bearing - compassHeading;

    // -180〜180度の範囲に正規化
    while (relativeBearing > 180) relativeBearing -= 360;
    while (relativeBearing <= -180) relativeBearing += 360;

    return relativeBearing;
  };

  const relativeBearing = getRelativeBearing();

  // ターゲット表示位置の計算
  const getTargetPosition = () => {
    if (relativeBearing === null) return { top: "50%", left: "50%" };

    // 画面中央を基準に、相対方位に基づいた位置を計算
    // 範囲を制限して画面内に収める
    const maxAngle = 50; // 画面内に表示する最大角度
    const clampedAngle = Math.max(
      -maxAngle,
      Math.min(maxAngle, relativeBearing)
    );
    const leftPos = 50 + (clampedAngle / maxAngle) * 40; // 画面中央から最大±40%の範囲

    // 垂直位置はシンプルに中央
    return {
      top: "50%",
      left: `${leftPos}%`,
    };
  };

  const targetStyle = getTargetPosition();

  // 距離表示のフォーマット
  const formatDistance = (meters: number | null) => {
    if (meters === null) return "不明";

    if (meters < 1000) {
      return `${Math.round(meters)}メートル`;
    } else {
      return `${(meters / 1000).toFixed(1)}キロメートル`;
    }
  };

  // ターゲットが画面範囲外の場合の矢印表示
  const getDirectionIndicator = () => {
    if (relativeBearing === null) return null;

    if (relativeBearing > 60) {
      return <ArrowUp className="h-8 w-8 text-white" />;
    } else if (relativeBearing < -60) {
      return <ArrowDown className="h-8 w-8 text-white" />;
    }

    return null;
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300">
        <h3 className="font-bold mb-2">エラーが発生しました</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-700 dark:text-yellow-300">
        <h3 className="font-bold mb-2">AR機能がサポートされていません</h3>
        <p>お使いの端末またはブラウザではAR表示機能をご利用いただけません。</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[70vh] overflow-hidden bg-black rounded-lg"
      ref={containerRef}
    >
      {/* カメラビュー */}
      <video
        ref={videoRef}
        className="absolute w-full h-full object-cover"
        playsInline
        autoPlay
        muted
      />

      {/* ペルミッション取得ボタン */}
      {!isInitialized && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
          <p className="text-white mb-4">
            カメラと方位情報へのアクセス許可が必要です
          </p>
          <Button onClick={startAR} className="bg-primary hover:bg-primary/90">
            ARモードを開始
          </Button>
        </div>
      )}

      {/* ターゲットマーカー */}
      {isInitialized && targetPosition && currentPosition && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            top: targetStyle.top,
            left: targetStyle.left,
          }}
        >
          <div className="flex flex-col items-center">
            {getDirectionIndicator()}
            <div className="bg-primary-600/80 p-2 rounded-full shadow-glow animate-pulse">
              <MapPin className="h-10 w-10 text-white" />
            </div>
            <div className="bg-black/70 mt-2 px-3 py-1 rounded-full text-white text-sm">
              {targetName}
            </div>
            {distance !== null && (
              <div className="bg-black/70 mt-1 px-3 py-1 rounded-full text-white text-xs">
                {formatDistance(distance)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* コンパス表示 */}
      {isInitialized && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-3 py-1 rounded-full">
          <div className="flex items-center text-white">
            <Compass className="h-5 w-5 mr-2" />
            {compassHeading !== null
              ? `${Math.round(compassHeading)}°`
              : "コンパス情報がありません"}
          </div>
        </div>
      )}
    </div>
  );
}
