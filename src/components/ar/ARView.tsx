"use client";

import { useEffect, useRef, useState } from "react";
import { useAR } from "@/hooks/ar/useAR";
import { GeoPosition } from "@/types/location";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Compass, MapPin, Target, Flag } from "lucide-react";

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
      className="relative w-full h-[70vh] overflow-hidden bg-black rounded-lg ar-container"
      ref={containerRef}
    >
      {/* カメラビュー */}
      <video
        ref={videoRef}
        className="absolute w-full h-full object-cover ar-container"
        playsInline
        autoPlay
        muted
      />

      {/* ペルミッション取得ボタン */}
      {!isInitialized && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 ar-container">
          <div className="text-center space-y-4 ar-float">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4 ar-glow">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-white text-lg font-semibold">AR位置ガイド</h3>
            <p className="text-white/80 text-sm max-w-xs">
              カメラと方位情報へのアクセス許可が必要です
            </p>
            <Button
              onClick={startAR}
              className="bg-primary hover:bg-primary/90 px-8 py-3 text-base font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              ARモードを開始
            </Button>
          </div>
        </div>
      )}

      {/* ターゲットマーカー - 看板とゴールマーカー */}
      {isInitialized && targetPosition && currentPosition && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 ar-container"
          style={{
            top: targetStyle.top,
            left: targetStyle.left,
          }}
        >
          <div className="flex flex-col items-center space-y-3">
            {/* 方向矢印（画面外の場合） */}
            {getDirectionIndicator() && (
              <div className="bg-white/90 ar-backdrop p-2 rounded-full shadow-lg animate-bounce">
                {getDirectionIndicator()}
              </div>
            )}

            {/* ゴール旗とポール */}
            <div className="relative ar-goal-marker">
              {/* 旗のポール */}
              <div className="w-1 h-16 bg-gradient-to-b from-yellow-600 to-yellow-800 mx-auto shadow-lg"></div>
              
              {/* 旗 */}
              <div className="absolute top-0 left-1 w-12 h-8 bg-gradient-to-r from-red-500 to-red-600 shadow-lg animate-pulse">
                <div className="w-full h-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400/50 to-transparent"></div>
                  <Flag className="absolute top-1 left-1 h-4 w-4 text-white/80" />
                </div>
              </div>
            </div>

            {/* メインマーカー */}
            <div className="relative ar-marker">
              {/* パルス効果のアウターリング */}
              <div className="absolute inset-0 bg-primary/30 rounded-full ar-pulse-ring"></div>
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse scale-125"></div>
              <div className="absolute inset-0 bg-green-400/30 rounded-full ar-pulse-ring animation-delay-500"></div>

              {/* メインマーカー */}
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-full shadow-2xl border-4 border-white/50 ar-backdrop ar-glow">
                <Target className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
            </div>

            {/* 看板型情報パネル */}
            <div className="relative ar-signboard">
              {/* 看板のポスト */}
              <div className="w-2 h-8 bg-gradient-to-b from-amber-700 to-amber-900 mx-auto shadow-lg"></div>
              
              {/* 看板本体 */}
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 border-4 border-amber-800 rounded-lg px-6 py-4 shadow-2xl ar-backdrop min-w-[160px] relative">
                {/* 看板の装飾 */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-amber-600 rounded-full"></div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-amber-600 rounded-full"></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 bg-amber-600 rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 bg-amber-600 rounded-full"></div>
                
                <div className="text-center relative z-10">
                  <div className="text-amber-900 font-bold text-lg leading-tight truncate max-w-[120px] drop-shadow-sm">
                    🎯 {targetName}
                  </div>
                  {distance !== null && (
                    <div className="text-amber-800 text-sm mt-1 font-bold tabular-nums drop-shadow-sm">
                      📍 {formatDistance(distance)}
                    </div>
                  )}
                  <div className="text-amber-700 text-xs mt-1 font-medium">
                    ゴール地点
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* スタイリッシュなコンパス表示 */}
      {isInitialized && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 ar-container">
          <div className="bg-black/80 ar-backdrop rounded-full px-4 py-2 shadow-xl border border-white/10">
            <div className="flex items-center text-white space-x-2">
              <div className="relative">
                <Compass
                  className="h-5 w-5 text-primary-300"
                  style={{
                    transform:
                      compassHeading !== null
                        ? `rotate(${compassHeading}deg)`
                        : "none",
                    transition: "transform 0.3s ease-out",
                  }}
                />
              </div>
              <span className="text-sm font-medium tabular-nums">
                {compassHeading !== null
                  ? `${Math.round(compassHeading)}°`
                  : "--°"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AR情報オーバーレイ */}
      {isInitialized && (
        <div className="absolute top-4 left-4 ar-container">
          <div className="bg-black/60 ar-backdrop rounded-xl px-3 py-2 border border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-medium tracking-wide">
                AR ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
