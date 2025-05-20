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

    if (!shareCode.trim()) {
      toast.error("共有コードを入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const location = await getLocationByShareCode(shareCode);
      console.log("API Response:", location);

      if (!location || !location.success || !location.data) {
        console.log("Condition failed:", {
          locationIsNull: !location,
          successIsFalse: location && !location.success,
          dataIsMissing: location && location.success && !location.data,
        });
        toast.error("指定された共有コードの位置情報が見つかりませんでした");
        return;
      }

      // 見つかった位置情報の有効期限を確認
      const expiresAt = new Date(location.data.expires_at);
      if (expiresAt < new Date()) {
        toast.error("この位置情報の共有期限が切れています");
        return;
      }

      // データが見つかった場合の処理
      toast.success(`${shareCode}の位置情報を表示します`);

      // コールバック関数があれば呼び出す
      if (onLocationFound) {
        const geoPosition: GeoPosition = {
          latitude: location.data.latitude,
          longitude: location.data.longitude,
          accuracy: location.data.accuracy || undefined,
          altitude: location.data.altitude || undefined,
          heading: location.data.heading || undefined,
        };

        const name = location.data.location_name || "共有位置";
        onLocationFound(geoPosition, name);
      }

      // ルーター利用のリダイレクトは不要、同じページ内で操作
    } catch (error) {
      console.error("位置情報の取得エラー:", error);
      toast.error("位置情報の取得に失敗しました");
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
