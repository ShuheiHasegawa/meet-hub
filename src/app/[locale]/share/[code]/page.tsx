import { getSharedLocation } from "@/app/actions/location-actions";
import { notFound } from "next/navigation";
import SharedLocationView from "@/components/share/SharedLocationView";
import { ensureLocationsTable } from "@/app/actions/setup-locations";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface SharedLocationPageProps {
  params: {
    code: string;
  };
}

export default async function SharedLocationPage({
  params,
}: SharedLocationPageProps) {
  const { code } = params;

  // 位置情報テーブルの確認
  const { success: tableExists, error: tableError } =
    await ensureLocationsTable();

  // テーブルが存在しない場合はエラーを表示
  if (!tableExists) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">共有位置情報</h1>

        <Alert variant="destructive">
          <AlertTitle>データベースエラー</AlertTitle>
          <AlertDescription>{tableError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // 共有コードから位置情報を取得
  const { success, location, error } = await getSharedLocation(code);

  // 位置情報が見つからない場合は404
  if (!success || !location) {
    notFound();
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">共有位置情報</h1>

      <SharedLocationView location={location} />
    </div>
  );
}
