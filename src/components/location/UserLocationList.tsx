"use client";

import React, { useState, useEffect } from "react";
import { getMyLocations, deleteLocation } from "@/app/actions/location";
import type { SharedLocation } from "@/types/location";
import { isShareCodeValid, getTimeUntilExpiry } from "@/lib/location/shareCode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Share2, LogIn } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

// 地図コンポーネントを動的にインポート
const LocationMap = dynamic(() => import("@/components/map/LocationMap"), {
  ssr: false,
});

export default function UserLocationList() {
  const [locations, setLocations] = useState<SharedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ja";

  // 位置情報を取得
  const fetchLocations = async () => {
    setLoading(true);
    setIsAuthError(false);

    try {
      const response = await getMyLocations();
      if (response.success && response.data) {
        setLocations(response.data);
      } else {
        setError(response.error || "位置情報の取得に失敗しました");
        // 認証エラーをチェック
        if (response.error && response.error.includes("認証")) {
          setIsAuthError(true);
        }
      }
    } catch (err) {
      setError("位置情報の読み込み中にエラーが発生しました");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchLocations();
  }, []);

  // 位置情報の削除
  const handleDelete = async (id: string) => {
    if (!confirm("この位置情報を削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await deleteLocation(id);

      if (response.success) {
        toast.success("位置情報を削除しました");
        // リストを更新
        setLocations((prev) => prev.filter((loc) => loc.id !== id));
      } else {
        toast.error(response.error || "削除に失敗しました");
      }
    } catch (err) {
      toast.error("削除中にエラーが発生しました");
      console.error(err);
    }
  };

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

  // 有効期限が切れているか確認
  const isExpired = (expiryDate: string) => {
    return !isShareCodeValid(expiryDate);
  };

  // 位置情報コードをコピー
  const copyShareCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("共有コードをコピーしました");
  };

  // Web Share APIを使用して共有
  const shareLocation = async (shareCode: string, locationName: string) => {
    if (!navigator.share) {
      copyShareCode(shareCode);
      return;
    }

    try {
      await navigator.share({
        title: `位置情報共有: ${locationName || "共有位置"}`,
        text: `位置情報共有コード: ${shareCode}`,
        url: `${window.location.origin}/share/${shareCode}`,
      });
      toast.success("共有しました");
    } catch (error) {
      // ユーザーがキャンセルした場合はエラーを表示しない
      if ((error as Error).name !== "AbortError") {
        console.error("共有エラー:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">位置情報を読み込んでいます...</div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg">
        <p className="font-medium">エラーが発生しました</p>
        <p className="text-sm mt-1">{error}</p>

        <div className="mt-4 flex gap-2">
          {isAuthError ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${locale}/sign-in`)}
              className="flex items-center"
            >
              <LogIn className="mr-2 h-4 w-4" />
              サインイン
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchLocations}
            >
              再読み込み
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>共有中の位置情報はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {locations.map((location) => {
        const expired = isExpired(location.expires_at);

        return (
          <Card key={location.id} className={expired ? "opacity-70" : ""}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {location.title || "名称未設定の場所"}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Badge variant={expired ? "outline" : "secondary"}>
                    {expired ? "期限切れ" : "共有中"}
                  </Badge>
                  <Badge variant="outline">コード: {location.share_code}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-2">
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">位置:</span>{" "}
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </div>

                {location.description && (
                  <div>
                    <span className="text-muted-foreground">メッセージ:</span>{" "}
                    {location.description}
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground">作成:</span>{" "}
                  {formatDate(location.created_at)}
                </div>

                <div>
                  <span className="text-muted-foreground">有効期限:</span>{" "}
                  {expired ? (
                    <span className="text-red-500">期限切れ</span>
                  ) : (
                    <span className="text-green-500">
                      残り {getTimeUntilExpiry(location.expires_at)}
                    </span>
                  )}
                </div>

                {/* 地図プレビュー */}
                <div className="mt-2 h-[150px] rounded-md overflow-hidden border">
                  <LocationMap
                    center={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    zoom={14}
                    showCurrentLocation={false}
                    height="150px"
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
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyShareCode(location.share_code)}
                >
                  コードをコピー
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    shareLocation(location.share_code, location.title || "")
                  }
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  共有
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => handleDelete(location.id)}
              >
                削除
              </Button>
            </CardFooter>
          </Card>
        );
      })}

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={fetchLocations}>
          最新の情報に更新
        </Button>
      </div>
    </div>
  );
}
