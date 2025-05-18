"use client";

import React, { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { shareLocation } from "@/app/actions/location";
import type { CreateSharedLocationInput } from "@/types/location";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn } from "lucide-react";

// Leaflet地図コンポーネントを動的にインポート (SSRなし)
const LocationMap = dynamic(() => import("@/components/map/LocationMap"), {
  ssr: false,
});

export default function ShareLocationForm() {
  // Geolocation APIを使用して現在位置を取得
  const { position, error, loading, getCurrentPosition } = useGeolocation({
    enableHighAccuracy: true,
  });

  // フォームの状態
  const [formData, setFormData] = useState<CreateSharedLocationInput>({
    latitude: 0,
    longitude: 0,
    location_name: "",
    message: "",
    expiresInMinutes: 60, // デフォルト1時間
  });

  // 位置情報が取得されたらフォームを更新
  useEffect(() => {
    if (position) {
      setFormData((prev) => ({
        ...prev,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        accuracy: position.accuracy,
        heading: position.heading,
        speed: position.speed,
      }));
    }
  }, [position]);

  // 送信中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 共有コード
  const [shareCode, setShareCode] = useState<string | null>(null);
  // 認証エラー
  const [authError, setAuthError] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ja";

  // 位置情報を更新
  const handleUpdateLocation = async () => {
    try {
      await getCurrentPosition();
      toast.success("位置情報を更新しました");
    } catch (error) {
      toast.error("位置情報の取得に失敗しました");
      console.error("位置情報取得エラー:", error);
    }
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!position) {
      toast.error("位置情報が取得できていません。再度お試しください。");
      return;
    }

    setIsSubmitting(true);
    setAuthError(false);

    try {
      // サーバーアクションを呼び出し
      const result = await shareLocation(formData);

      if (result.success && result.share_code) {
        toast.success("位置情報を共有しました");
        setShareCode(result.share_code);
        // フォームの内容をリセット（位置情報は保持）
        setFormData((prev) => ({
          ...prev,
          location_name: "",
          message: "",
          expiresInMinutes: 60,
        }));
      } else {
        toast.error(result.error || "位置情報の共有に失敗しました");

        // 認証エラーをチェック
        if (result.error && result.error.includes("認証")) {
          setAuthError(true);
        }
      }
    } catch (error) {
      toast.error("位置情報の共有に失敗しました");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 入力変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 有効期限変更ハンドラ
  const handleExpiryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      expiresInMinutes: parseInt(value, 10),
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* 認証エラーの表示 */}
        {authError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle className="flex items-center gap-2">
              認証エラー
            </AlertTitle>
            <AlertDescription>
              <p>位置情報を共有するにはサインインが必要です</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => router.push(`/${locale}/sign-in`)}
              >
                <LogIn className="mr-2 h-4 w-4" />
                サインイン
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 位置情報 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium">現在位置</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUpdateLocation}
              disabled={loading}
            >
              {loading ? "取得中..." : "位置を更新"}
            </Button>
          </div>

          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
              位置情報の取得に失敗しました: {error.message}
            </div>
          ) : position ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">緯度:</span>{" "}
                  {position.latitude.toFixed(6)}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">経度:</span>{" "}
                  {position.longitude.toFixed(6)}
                </div>
                {position.accuracy && (
                  <div className="text-sm col-span-2">
                    <span className="text-muted-foreground">精度:</span>{" "}
                    {position.accuracy.toFixed(1)}m
                  </div>
                )}
              </div>

              {/* 地図プレビュー */}
              <div className="mt-3 h-[200px] rounded-md overflow-hidden border">
                <LocationMap
                  center={{
                    latitude: position.latitude,
                    longitude: position.longitude,
                  }}
                  zoom={15}
                  showCurrentLocation={true}
                  height="200px"
                  targets={[
                    {
                      position: {
                        latitude: position.latitude,
                        longitude: position.longitude,
                      },
                      name: "現在地",
                      popupContent: "あなたの現在位置",
                    },
                  ]}
                />
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-3 rounded-md text-sm">
              {loading
                ? "位置情報を取得しています..."
                : "位置情報を取得するには「位置を更新」をクリックしてください"}
            </div>
          )}
        </div>

        {/* 場所の名前 */}
        <div className="space-y-2">
          <Label htmlFor="location_name">場所の名前（任意）</Label>
          <Input
            id="location_name"
            name="location_name"
            placeholder="待ち合わせ場所"
            value={formData.location_name || ""}
            onChange={handleChange}
          />
        </div>

        {/* メッセージ */}
        <div className="space-y-2">
          <Label htmlFor="message">メッセージ（任意）</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="この辺で待っています"
            value={formData.message || ""}
            onChange={handleChange}
          />
        </div>

        {/* 有効期限 */}
        <div className="space-y-2">
          <Label htmlFor="expiresIn">有効期限</Label>
          <Select
            value={formData.expiresInMinutes?.toString() || "60"}
            onValueChange={handleExpiryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="有効期限を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15分</SelectItem>
              <SelectItem value="30">30分</SelectItem>
              <SelectItem value="60">1時間</SelectItem>
              <SelectItem value="180">3時間</SelectItem>
              <SelectItem value="360">6時間</SelectItem>
              <SelectItem value="720">12時間</SelectItem>
              <SelectItem value="1440">24時間</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 送信ボタン */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !position}
        >
          {isSubmitting ? "共有中..." : "位置を共有する"}
        </Button>
      </div>

      {/* 共有コード表示 */}
      {shareCode && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">位置情報を共有しました</CardTitle>
            <CardDescription>
              以下のコードを相手に伝えてください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-primary-50 dark:bg-primary-950 p-3 rounded-md text-center">
              <span className="text-2xl font-bold tracking-widest">
                {shareCode}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareCode);
                toast.success("共有コードをコピーしました");
              }}
            >
              コードをコピー
            </Button>

            {/* Web Share APIを追加 */}
            {navigator.share && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: "位置情報の共有",
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
                }}
              >
                他のアプリで共有
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </form>
  );
}
