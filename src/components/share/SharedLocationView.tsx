"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Loader2,
  MapPin,
  Navigation,
  Compass,
  ArrowUp,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Location, LocationWithDistance } from "@/types/location";
import {
  calculateDistanceAndBearing,
  getFormattedDistance,
  getRelativeDirection,
  calculatePointerDirection,
} from "@/lib/location/geo-utils";

interface SharedLocationViewProps {
  location: Location | LocationWithDistance;
}

export default function SharedLocationView({
  location,
}: SharedLocationViewProps) {
  const {
    position,
    loading,
    error,
    getCurrentPosition,
    startWatching,
    stopWatching,
  } = useGeolocation();
  const [locationWithDistance, setLocationWithDistance] =
    useState<LocationWithDistance>({
      ...location,
      distance: undefined,
      bearing: undefined,
    });
  const [deviceOrientation, setDeviceOrientation] = useState<{
    absolute: boolean;
    alpha: number | null; // Z軸周りの回転（コンパスヘッディング）
    beta: number | null; // X軸周りの回転（前後の傾き）
    gamma: number | null; // Y軸周りの回転（左右の傾き）
  }>({
    absolute: false,
    alpha: null,
    beta: null,
    gamma: null,
  });

  // ARモードのステータス
  const [arMode, setArMode] = useState(false);

  // コンポーネントがマウントされたら位置情報の監視を開始
  useEffect(() => {
    getCurrentPosition();
    startWatching();

    return () => {
      stopWatching();
    };
  }, [getCurrentPosition, startWatching, stopWatching]);

  // デバイスの向きセンサーを監視
  useEffect(() => {
    // デバイス方向のイベントリスナー
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation({
        absolute: event.absolute,
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      });
    };

    // デバイス方向APIが存在するか確認
    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, []);

  // 現在位置から目的地までの距離と方位を計算
  useEffect(() => {
    if (position && location) {
      try {
        const targetPosition = {
          latitude: location.latitude,
          longitude: location.longitude,
          altitude: location.altitude,
        };

        const { distance, bearing } = calculateDistanceAndBearing(
          position,
          targetPosition
        );

        setLocationWithDistance((prev) => ({
          ...prev,
          distance,
          bearing,
        }));
      } catch (error) {
        console.error("距離計算エラー:", error);
      }
    }
  }, [position, location]);

  // ARモードの切り替え
  const toggleARMode = () => {
    if (!arMode) {
      // ARモードをオンにする前にセンサー許可を要求
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        // iOS 13+ の場合、許可を要求
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((permissionState: string) => {
            if (permissionState === "granted") {
              setArMode(true);
            } else {
              alert(
                "ARモードを使用するには、デバイスの向きセンサーへのアクセスを許可してください。"
              );
            }
          })
          .catch(console.error);
      } else {
        // 他のデバイスの場合はそのまま有効化
        setArMode(true);
      }
    } else {
      setArMode(false);
    }
  };

  // 方向を指すポインタの角度を計算
  const getPointerStyle = () => {
    if (
      !position ||
      !deviceOrientation.alpha ||
      !locationWithDistance.bearing
    ) {
      return {};
    }

    const pointerAngle = calculatePointerDirection(
      position,
      {
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude,
      },
      deviceOrientation.alpha
    );

    return {
      transform: `rotate(${pointerAngle}deg)`,
    };
  };

  // 位置情報の日時をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("ja-JP") + " " + date.toLocaleTimeString("ja-JP")
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{location.title || "共有位置情報"}</CardTitle>
          <CardDescription>
            {location.description || "位置情報が共有されています"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 位置情報の詳細 */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>
                緯度: {location.latitude.toFixed(6)}, 経度:{" "}
                {location.longitude.toFixed(6)}
              </span>
            </div>
            <div>共有日時: {formatDate(location.created_at)}</div>
            {location.expires_at && (
              <div>有効期限: {formatDate(location.expires_at)}</div>
            )}
          </div>

          {/* 自分の位置情報の読み込み状態 */}
          {loading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>あなたの位置情報を取得しています...</span>
            </div>
          )}

          {/* 位置情報取得エラー */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>位置情報エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <Button
                variant="outline"
                onClick={getCurrentPosition}
                className="mt-2"
              >
                再試行
              </Button>
            </Alert>
          )}

          {/* 距離と方向の表示 */}
          {position && locationWithDistance.distance !== undefined && (
            <Alert>
              <Navigation className="h-4 w-4" />
              <AlertTitle>
                距離: {getFormattedDistance(locationWithDistance.distance)}
              </AlertTitle>
              <AlertDescription>
                方角: {getRelativeDirection(locationWithDistance.bearing || 0)}(
                {Math.round(locationWithDistance.bearing || 0)}°)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={getCurrentPosition}
            disabled={loading}
          >
            <Compass className="mr-2 h-4 w-4" />
            位置を更新
          </Button>

          <Button onClick={toggleARMode} disabled={!position}>
            {arMode ? "ARモード終了" : "ARモードで見る"}
          </Button>
        </CardFooter>
      </Card>

      {/* ARモード表示 */}
      {arMode && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="absolute top-6 left-0 right-0 text-center">
            <h2 className="text-white text-xl font-bold">ARモード</h2>
            <p className="text-white/70">
              スマホを持って周りを見回してください
            </p>
          </div>

          {/* 方向ポインター */}
          <div
            className="w-32 h-32 flex items-center justify-center"
            style={getPointerStyle()}
          >
            <ArrowUp className="h-24 w-24 text-yellow-400" />
          </div>

          {/* 距離表示 */}
          {locationWithDistance.distance !== undefined && (
            <div className="absolute bottom-20 left-0 right-0 text-center">
              <div className="text-white text-3xl font-bold">
                {getFormattedDistance(locationWithDistance.distance)}
              </div>
              <div className="text-white/70">
                {getRelativeDirection(locationWithDistance.bearing || 0)}方向
              </div>
            </div>
          )}

          {/* 閉じるボタン */}
          <Button
            variant="outline"
            className="absolute bottom-6 left-0 right-0 mx-auto w-32"
            onClick={() => setArMode(false)}
          >
            閉じる
          </Button>
        </div>
      )}
    </div>
  );
}
