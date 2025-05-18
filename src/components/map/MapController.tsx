"use client";

import { useState } from "react";
import { GeoPosition } from "@/types/location";
import SharedLocationForm from "../location/SharedLocationForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPinIcon } from "lucide-react";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { toast } from "sonner";

// グローバル状態として表示するターゲット位置情報を保持
// 本来はZustandやContextなどの状態管理を使うべきですが
// 簡単のためカスタムイベントを使用します
export const mapTargetEvent =
  typeof window !== "undefined" ? new EventTarget() : null;

// カスタムイベント定義
const MAP_TARGET_CHANGED = "map-target-changed";

// イベントを発行する関数
export function dispatchMapTargetEvent(
  target: { position: GeoPosition; name: string } | null
) {
  if (!mapTargetEvent) return;
  const event = new CustomEvent(MAP_TARGET_CHANGED, { detail: target });
  mapTargetEvent.dispatchEvent(event);
}

// イベントを購読する関数
export function subscribeToMapTargetChanges(
  callback: (target: { position: GeoPosition; name: string } | null) => void
) {
  if (!mapTargetEvent) return () => {};

  const handler = (event: Event) => {
    callback((event as CustomEvent).detail);
  };

  mapTargetEvent.addEventListener(MAP_TARGET_CHANGED, handler);
  return () => {
    mapTargetEvent.removeEventListener(MAP_TARGET_CHANGED, handler);
  };
}

export default function MapController() {
  const [currentTarget, setCurrentTarget] = useState<{
    position: GeoPosition;
    name: string;
  } | null>(null);

  // 位置情報を取得
  const {
    position: currentPosition,
    loading: positionLoading,
    error: positionError,
    getCurrentPosition,
  } = useGeolocation({
    enableHighAccuracy: true,
  });

  // 共有コードからの位置情報取得時の処理
  const handleLocationFound = (location: GeoPosition, name: string) => {
    // 位置情報をセット
    const target = { position: location, name };
    setCurrentTarget(target);

    // イベントを発行してマップコンポーネントに通知
    dispatchMapTargetEvent(target);
  };

  // ターゲットのクリア
  const handleClearTarget = () => {
    setCurrentTarget(null);
    dispatchMapTargetEvent(null);
    toast.info("表示位置をクリアしました");
  };

  // 現在地へ移動
  const handleMoveToCurrentLocation = () => {
    if (!currentPosition) {
      getCurrentPosition();
      toast.info("位置情報を取得しています...");
      return;
    }

    const target = {
      position: currentPosition,
      name: "現在地",
    };

    setCurrentTarget(target);
    dispatchMapTargetEvent(target);
    toast.success("現在地を中心に表示します");
  };

  return (
    <div>
      <SharedLocationForm onLocationFound={handleLocationFound} />

      <div className="mt-4 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleMoveToCurrentLocation}
        >
          <MapPinIcon className="h-4 w-4 mr-2" />
          現在地へ移動
        </Button>

        {currentTarget && (
          <div className="bg-muted/50 p-2 rounded-md mt-4">
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="mb-2">
                表示中
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full"
                onClick={handleClearTarget}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-sm font-medium">{currentTarget.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              緯度: {currentTarget.position.latitude.toFixed(6)}
              <br />
              経度: {currentTarget.position.longitude.toFixed(6)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
