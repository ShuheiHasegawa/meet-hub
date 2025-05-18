"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, MapPin, Loader2, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateShareLink } from "@/lib/location/geo-utils";
import { LocationCreate } from "@/types/location";

export default function CreateShareLocation() {
  const {
    position,
    loading: geoLoading,
    error: geoError,
    getCurrentPosition,
    startWatching,
    stopWatching,
  } = useGeolocation();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  const [shareState, setShareState] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
    shareCode: string | null;
    shareLink: string | null;
  }>({
    loading: false,
    error: null,
    success: false,
    shareCode: null,
    shareLink: null,
  });

  // コンポーネントがマウントされたら位置情報の監視を開始
  useEffect(() => {
    getCurrentPosition();
    const watchId = startWatching();

    return () => {
      stopWatching();
    };
  }, [getCurrentPosition, startWatching, stopWatching]);

  // フォーム入力の変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 位置情報を共有する
  const handleShare = async () => {
    if (!position) {
      setShareState((prev) => ({
        ...prev,
        error: "位置情報が取得できていません。再度お試しください。",
      }));
      return;
    }

    try {
      setShareState((prev) => ({ ...prev, loading: true, error: null }));

      console.log("位置情報を送信します:", {
        title: formData.title,
        description: formData.description,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        accuracy: position.accuracy,
        heading: position.heading,
      });

      // undefinedを明示的にnullに変換
      const locationData = {
        title: formData.title,
        description: formData.description,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude !== undefined ? position.altitude : null,
        accuracy: position.accuracy !== undefined ? position.accuracy : null,
        heading: position.heading !== undefined ? position.heading : null,
      };

      // 新しいAPIエンドポイントを呼び出し (30秒タイムアウトとなっているためクライアント側は20秒に設定)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        // 直接APIを呼び出し
        const response = await fetch("/api/share-location/direct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(locationData),
          signal: controller.signal,
        });

        // タイマーをクリア
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorText = errorData?.error || `エラー (${response.status})`;
          throw new Error(errorText);
        }

        const result = await response.json();
        console.log("共有結果:", result);

        if (!result.success) {
          setShareState((prev) => ({
            ...prev,
            loading: false,
            error: result.error || "位置情報の共有に失敗しました。",
          }));
          return;
        }

        const shareLink = generateShareLink(result.shareCode);

        setShareState({
          loading: false,
          error: null,
          success: true,
          shareCode: result.shareCode,
          shareLink,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // AbortError（タイムアウト）の場合
        if ((fetchError as Error).name === "AbortError") {
          throw new Error(
            "通信がタイムアウトしました。サーバーが混雑している可能性があります。"
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("位置情報共有エラー:", error);
      setShareState((prev) => ({
        ...prev,
        loading: false,
        error:
          (error as Error).message ||
          "位置情報の共有中にエラーが発生しました。",
      }));
    }
  };

  // 新しい共有を作成（リセット）
  const handleCreateNew = () => {
    setShareState({
      loading: false,
      error: null,
      success: false,
      shareCode: null,
      shareLink: null,
    });
    setFormData({ title: "", description: "" });
    getCurrentPosition();
  };

  // 共有リンクをクリップボードにコピー
  const copyToClipboard = async () => {
    if (!shareState.shareLink) return;

    try {
      await navigator.clipboard.writeText(shareState.shareLink);
      alert("共有リンクをクリップボードにコピーしました");
    } catch (error) {
      alert("クリップボードへのコピーに失敗しました");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>位置情報の共有</CardTitle>
        <CardDescription>
          現在地を共有して待ち合わせをスムーズに
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 位置情報の読み込み状態 */}
        {geoLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>位置情報を取得しています...</span>
          </div>
        )}

        {/* 位置情報のエラー */}
        {geoError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>位置情報エラー</AlertTitle>
            <AlertDescription>{geoError}</AlertDescription>
          </Alert>
        )}

        {/* 位置情報が取得できた場合の表示 */}
        {position && !geoLoading && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <MapPin className="h-4 w-4" />
              <span>位置情報の取得に成功しました</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <div>緯度: {position.latitude.toFixed(6)}</div>
              <div>経度: {position.longitude.toFixed(6)}</div>
              {position.accuracy && (
                <div>精度: 約{Math.round(position.accuracy)}m</div>
              )}
            </div>
          </div>
        )}

        {/* 共有情報の入力フォーム */}
        {!shareState.success && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                name="title"
                placeholder="例: カフェで待ってます"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">メッセージ (任意)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="例: 窓際の席にいます"
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {/* 共有成功時の表示 */}
        {shareState.success && shareState.shareCode && (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>共有コード: {shareState.shareCode}</AlertTitle>
              <AlertDescription>
                下記のリンクを共有して、あなたの位置情報を伝えましょう。
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="shareLink">共有リンク</Label>
              <div className="flex space-x-2">
                <Input
                  id="shareLink"
                  value={shareState.shareLink || ""}
                  readOnly
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button variant="outline" onClick={copyToClipboard}>
                  コピー
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {shareState.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラーが発生しました</AlertTitle>
            <AlertDescription>{shareState.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        {!shareState.success ? (
          <Button
            className="w-full"
            onClick={handleShare}
            disabled={!position || geoLoading || shareState.loading}
          >
            {shareState.loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                共有中...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                位置情報を共有する
              </>
            )}
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleCreateNew}
            variant="outline"
          >
            新しい共有を作成
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
