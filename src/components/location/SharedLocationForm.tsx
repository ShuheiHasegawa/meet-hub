"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { getLocationByShareCode } from "@/app/actions/location";
import { toast } from "sonner";
import { GeoPosition } from "@/types/location";
import { Loader2 } from "lucide-react";

interface SharedLocationFormProps {
  onLocationFound?: (location: GeoPosition, name: string) => void;
}

export default function SharedLocationForm({
  onLocationFound,
}: SharedLocationFormProps) {
  const [shareCode, setShareCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting share code:", shareCode);
    console.log("[ENV] 環境情報:", {
      NODE_ENV: process.env.NODE_ENV,
      HOST: typeof window !== "undefined" ? window.location.host : "server",
      URL: typeof window !== "undefined" ? window.location.href : "server",
    });

    // 共有コードを整形（トリムのみ）
    const trimmedShareCode = shareCode.trim();
    console.log("[DEBUG] 入力された共有コード:", shareCode);
    console.log("[DEBUG] 整形後の共有コード:", trimmedShareCode);

    if (!trimmedShareCode) {
      toast.error("共有コードを入力してください");
      return;
    }

    setIsLoading(true);

    try {
      // 共有コードで位置情報を検索
      console.log(`[DEBUG] 共有コード検索開始: "${trimmedShareCode}"`);
      console.log(`[DEBUG] API呼び出し前の時刻: ${new Date().toISOString()}`);
      const response = await getLocationByShareCode(trimmedShareCode);
      console.log(`[DEBUG] API呼び出し後の時刻: ${new Date().toISOString()}`);
      console.log(
        "[DEBUG] APIレスポンス完全なオブジェクト:",
        JSON.stringify(response, null, 2)
      );

      // レスポンスがnullの場合（データが見つからない）
      if (!response) {
        console.error("[ERROR] レスポンスがnullです");
        toast.error("指定された共有コードの位置情報が見つかりませんでした");
        return;
      }

      // エラーの場合
      if (!response.success) {
        console.error("[ERROR] APIエラー:", response.error);
        toast.error(response.error || "位置情報の取得に失敗しました");
        return;
      }

      // データがない場合
      if (!response.data) {
        console.error("[ERROR] データが空です");
        toast.error("位置情報のデータが見つかりませんでした");
        return;
      }

      // データの詳細ログ
      console.log("[DEBUG] 取得された位置情報の詳細:", {
        id: response.data.id,
        share_code: response.data.share_code,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        title: response.data.title,
        description: response.data.description,
        expires_at: response.data.expires_at,
      });

      // 見つかった位置情報の有効期限を確認
      const expiresAt = new Date(response.data.expires_at);
      const now = new Date();
      console.log("[DEBUG] 有効期限チェック:", {
        expiresAt,
        now,
        isExpired: expiresAt < now,
      });

      if (expiresAt < now) {
        toast.error("この位置情報の共有期限が切れています");
        return;
      }

      // データが見つかった場合の処理
      toast.success(`${trimmedShareCode}の位置情報を表示します`);
      console.log("[DEBUG] 位置情報の表示処理開始");

      // コールバック関数があれば呼び出す
      if (onLocationFound) {
        try {
          const geoPosition: GeoPosition = {
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            accuracy: response.data.accuracy || undefined,
            altitude: response.data.altitude || undefined,
            heading: response.data.heading || undefined,
          };

          const name = response.data.title || "共有位置";
          console.log("[DEBUG] コールバック呼び出し:", { geoPosition, name });
          onLocationFound(geoPosition, name);
        } catch (callbackError) {
          console.error("[ERROR] コールバック実行エラー:", callbackError);
          toast.error("位置情報の表示処理に失敗しました");
        }
      } else {
        console.log("[DEBUG] コールバック関数がありません");
      }
    } catch (error) {
      console.error("[ERROR] 位置情報の取得エラー:", error);
      toast.error(`位置情報の取得に失敗しました: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="共有コードを入力 (例: ABC123)"
          value={shareCode}
          onChange={(e) => setShareCode(e.target.value)}
          disabled={isLoading}
          className="w-full"
          maxLength={10}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            検索中...
          </>
        ) : (
          "位置情報を検索"
        )}
      </Button>
    </form>
  );
}
