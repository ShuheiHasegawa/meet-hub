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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
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
    setDebugInfo(null); // デバッグ情報をリセット

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

      // 詳細なデバッグ情報を構築
      const debugDetails = `
🔍 検索デバッグ情報:
────────────────────
🎯 検索コード: "${trimmedShareCode}"
⏰ 実行時刻: ${new Date().toLocaleString()}
🌐 環境: ${typeof window !== "undefined" ? window.location.host : "server"}

📊 API応答:
• 成功フラグ: ${response?.success ? "✅ true" : "❌ false"}
• データ有無: ${response?.data ? "✅ あり" : "❌ なし"}
• エラー: ${response?.error || "❌ なし"}

${
  (response as any)?.debug
    ? `
🔧 サーバーサイドデバッグ:
• 認証ユーザー: ${(response as any).debug.hasUser ? "✅ あり" : "❌ なし"}
• ユーザーEmail: ${(response as any).debug.userEmail}
• 認証エラー: ${(response as any).debug.authError || "❌ なし"}
• クエリ結果: ${(response as any).debug.queryResult}
• 検索対象コード: "${(response as any).debug.searchCode}"
• 元の入力: "${(response as any).debug.originalInput}"
${(response as any).debug.sampleCodes ? `• DB内の共有コード例: [${(response as any).debug.sampleCodes.slice(0, 3).join(", ")}]` : ""}
${(response as any).debug.totalRecords !== undefined ? `• DB内の総レコード数: ${(response as any).debug.totalRecords}` : ""}
`
    : ""
}

${
  response?.data
    ? `
📍 位置情報詳細:
• ID: ${response.data.id}
• 共有コード: ${response.data.share_code}
• タイトル: ${response.data.title || "未設定"}
• 有効状態: ${response.data.is_active ? "✅ 有効" : "❌ 無効"}
• 有効期限: ${new Date(response.data.expires_at).toLocaleString()}
• 作成日時: ${new Date(response.data.created_at).toLocaleString()}
`
    : ""
}
────────────────────`;

      setDebugInfo(debugDetails);

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

      // エラー時のデバッグ情報
      const errorDebugDetails = `
🚨 エラーデバッグ情報:
────────────────────
🎯 検索コード: "${trimmedShareCode}"
⏰ エラー発生時刻: ${new Date().toLocaleString()}
🌐 環境: ${typeof window !== "undefined" ? window.location.host : "server"}

❌ エラー詳細:
• エラーメッセージ: ${(error as Error).message}
• エラー種別: ${(error as Error).name}
• スタックトレース: ${(error as Error).stack || "なし"}

🔧 実行コンテキスト:
• ユーザーエージェント: ${typeof window !== "undefined" ? window.navigator.userAgent : "server"}
• 現在URL: ${typeof window !== "undefined" ? window.location.href : "server"}
────────────────────`;

      setDebugInfo(errorDebugDetails);
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

      {/* 詳細デバッグ情報の表示 */}
      {debugInfo && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              🔧 詳細デバッグ情報
            </h3>
            <button
              onClick={() => setDebugInfo(null)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm"
            >
              ✕ 閉じる
            </button>
          </div>
          <pre className="text-xs text-blue-900 dark:text-blue-100 whitespace-pre-wrap font-mono overflow-x-auto">
            {debugInfo}
          </pre>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(debugInfo)}
              className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
            >
              📋 コピー
            </button>
            <button
              onClick={() => {
                const blob = new Blob([debugInfo], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `debug-${new Date().toISOString()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
            >
              💾 保存
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
