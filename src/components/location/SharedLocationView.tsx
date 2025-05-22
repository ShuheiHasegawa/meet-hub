"use client";

import React from "react";
import { Share2, Navigation, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getTimeUntilExpiry } from "@/lib/location/shareCode";
import type { SharedLocation } from "@/types/location";
import dynamic from "next/dynamic";

// 地図コンポーネントを動的にインポート
const LocationMap = dynamic(() => import("@/components/map/LocationMap"), {
  ssr: false,
});

interface SharedLocationViewProps {
  location: SharedLocation;
  shareCode: string;
}

export default function SharedLocationView({
  location,
  shareCode,
}: SharedLocationViewProps) {
  // 日時をフォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // 現在の日時と共有期限を比較
  const now = new Date();
  const expiryDate = new Date(location.expires_at);
  const isExpired = now > expiryDate;

  // 現在地からナビゲーション
  const navigateTo = () => {
    // Google Mapsで現在地からのルートを開く
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
      "_blank"
    );
  };

  // 位置情報を共有
  const shareLocation = async () => {
    if (!navigator.share) {
      toast("共有する方法がありません。リンクをコピーして共有してください。");
      return;
    }

    try {
      await navigator.share({
        title: `位置情報共有: ${location.title || "共有位置"}`,
        text: `${location.description || "位置情報を共有しています"}`,
        url: window.location.href,
      });
    } catch (error) {
      // ユーザーがキャンセルした場合はエラーを表示しない
      if ((error as Error).name !== "AbortError") {
        console.error("共有エラー:", error);
      }
    }
  };

  return (
    <>
      {/* 地図表示 */}
      <div className="h-[300px] w-full">
        <LocationMap
          center={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          zoom={15}
          showCurrentLocation={true}
          height="300px"
          targets={[
            {
              position: {
                latitude: location.latitude,
                longitude: location.longitude,
              },
              name: location.title || "共有位置",
              icon: "red",
            },
          ]}
        />
      </div>

      {/* 位置情報詳細 */}
      <Card className="border-none rounded-none">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                {location.title || "共有された位置"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                共有コード: {shareCode}
              </p>
            </div>
            <Badge variant={isExpired ? "destructive" : "secondary"}>
              {isExpired ? "期限切れ" : "有効"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {location.description && (
              <div className="bg-muted/50 p-3 rounded-md flex">
                <MessageSquare className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">メッセージ</p>
                  <p className="mt-1">{location.description}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">位置</p>
                <p className="font-medium">
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </p>
              </div>

              {location.accuracy && (
                <div>
                  <p className="text-sm text-muted-foreground">精度</p>
                  <p className="font-medium">{location.accuracy.toFixed(0)}m</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">共有日時</p>
                <p className="font-medium">{formatDate(location.created_at)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">有効期限</p>
                <div className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {isExpired ? (
                    <span className="text-red-500">期限切れ</span>
                  ) : (
                    <span>残り {getTimeUntilExpiry(location.expires_at)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button className="flex-1" onClick={navigateTo}>
            <Navigation className="h-4 w-4 mr-2" />
            ここへ行く
          </Button>
          <Button variant="outline" className="flex-1" onClick={shareLocation}>
            <Share2 className="h-4 w-4 mr-2" />
            再共有する
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
