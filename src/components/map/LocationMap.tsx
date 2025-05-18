"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoPosition } from "@/types/location";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { Button } from "../ui/button";
import { RefreshCcw, Target, Navigation } from "lucide-react";
import { subscribeToMapTargetChanges } from "./MapController";

// マーカーのアイコン設定
const createIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// アイコン定義
const icons = {
  blue: createIcon("blue"),
  red: createIcon("red"),
  green: createIcon("green"),
  orange: createIcon("orange"),
  yellow: createIcon("yellow"),
  violet: createIcon("violet"),
};

interface Target {
  position: GeoPosition;
  name: string;
  icon?: keyof typeof icons;
  popupContent?: React.ReactNode;
}

interface LocationMapProps {
  targets?: Target[];
  center?: GeoPosition;
  showCurrentLocation?: boolean;
  zoom?: number;
  height?: string;
}

// マップの表示範囲を自動調整するコンポーネント
function MapBounds({
  currentPosition,
  targets,
}: {
  currentPosition?: GeoPosition;
  targets?: Target[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points: L.LatLngExpression[] = [];

    // 現在位置を追加
    if (currentPosition) {
      points.push([currentPosition.latitude, currentPosition.longitude]);
    }

    // ターゲット位置を追加
    if (targets && targets.length > 0) {
      targets.forEach((target) => {
        points.push([target.position.latitude, target.position.longitude]);
      });
    }

    // 表示範囲に少なくとも2点ある場合は範囲を調整
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
    }
    // 1点だけの場合はその位置にズーム
    else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, currentPosition, targets]);

  return null;
}

// マップをセンタリングするボタン用コンポーネント
function CenterControl({ position }: { position: GeoPosition }) {
  const map = useMap();

  const handleCenter = () => {
    map.setView([position.latitude, position.longitude], 15);
  };

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={handleCenter}
          className="w-8 h-8 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100"
          title="現在地にフォーカス"
        >
          <Target className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function LocationMap({
  targets = [],
  center,
  showCurrentLocation = true,
  zoom = 15,
  height = "400px",
}: LocationMapProps) {
  // マップがマウントされたことを確認
  const [mapReady, setMapReady] = useState(false);

  // カスタムターゲット（MapControllerから受け取る）
  const [customTargets, setCustomTargets] = useState<Target[]>([]);

  // 現在位置を取得
  const {
    position: currentPosition,
    loading: positionLoading,
    error: positionError,
    getCurrentPosition,
  } = useGeolocation();

  // マップコンテナがマウントされたらフラグを立てる
  useEffect(() => {
    setMapReady(true);
  }, []);

  // MapControllerからのイベントを購読
  useEffect(() => {
    // イベント購読
    const unsubscribe = subscribeToMapTargetChanges((target) => {
      if (target) {
        // 新しいターゲットを追加（他のカスタムターゲットは削除）
        setCustomTargets([
          {
            position: target.position,
            name: target.name,
            icon: "red",
          },
        ]);
      } else {
        // ターゲットをクリア
        setCustomTargets([]);
      }
    });

    return unsubscribe;
  }, []);

  // 表示するすべてのターゲット（props + カスタム）
  const allTargets = [...targets, ...customTargets];

  // マップの初期中心位置を設定（絶対にnullにならないようにデフォルト値を確保）
  let initialCenter: L.LatLngExpression = [35.6812, 139.7671]; // デフォルトは東京

  if (
    center &&
    typeof center.latitude === "number" &&
    typeof center.longitude === "number"
  ) {
    initialCenter = [center.latitude, center.longitude];
  } else if (
    currentPosition &&
    typeof currentPosition.latitude === "number" &&
    typeof currentPosition.longitude === "number"
  ) {
    initialCenter = [currentPosition.latitude, currentPosition.longitude];
  }

  return (
    <div className="relative">
      {/* 位置情報の更新ボタン */}
      <div className="absolute top-2 left-2 z-[1000]">
        <Button
          variant="secondary"
          size="sm"
          onClick={getCurrentPosition}
          disabled={positionLoading}
          className="bg-white/80 hover:bg-white shadow"
        >
          <RefreshCcw
            className={`h-4 w-4 mr-2 ${positionLoading ? "animate-spin" : ""}`}
          />
          位置情報を更新
        </Button>
      </div>

      {/* 位置情報のエラー表示 */}
      {positionError && (
        <div className="absolute top-12 left-2 z-[1000] max-w-xs">
          <div className="bg-red-500/80 text-white px-3 py-1.5 rounded-md text-xs">
            位置情報の取得に失敗: {positionError}
          </div>
        </div>
      )}

      {/* マップ */}
      <div className="rounded-lg overflow-hidden shadow-lg" style={{ height }}>
        <MapContainer
          center={initialCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          // touchZoom, doubleClickZoomなどの追加オプション
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 現在位置のマーカー */}
          {showCurrentLocation && currentPosition && (
            <Marker
              position={[currentPosition.latitude, currentPosition.longitude]}
              icon={icons.blue}
            >
              <Popup>
                <div>
                  <strong>現在地</strong>
                  <br />
                  緯度: {currentPosition.latitude.toFixed(6)}
                  <br />
                  経度: {currentPosition.longitude.toFixed(6)}
                  {currentPosition.accuracy && (
                    <>
                      <br />
                      精度: {currentPosition.accuracy.toFixed(1)}m
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* ターゲット位置のマーカー */}
          {allTargets.map((target, index) => (
            <Marker
              key={index}
              position={[target.position.latitude, target.position.longitude]}
              icon={icons[target.icon || "red"]}
            >
              <Popup>
                {target.popupContent || (
                  <div>
                    <strong>{target.name}</strong>
                    <br />
                    緯度: {target.position.latitude.toFixed(6)}
                    <br />
                    経度: {target.position.longitude.toFixed(6)}
                  </div>
                )}
              </Popup>
            </Marker>
          ))}

          {/* 地図の表示範囲を自動調整 */}
          {mapReady && (
            <MapBounds
              currentPosition={
                showCurrentLocation ? currentPosition : undefined
              }
              targets={allTargets}
            />
          )}

          {/* 現在地へのセンタリングボタン */}
          {currentPosition && <CenterControl position={currentPosition} />}
        </MapContainer>
      </div>
    </div>
  );
}
