import { getUserProfile } from "@/lib/profile/server";
import ProfileClient from "@/components/profile/ProfileClient";
import { ensureProfilesTable } from "@/app/actions/setup";

interface ProfilePageProps {
  params: {
    locale: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = params;

  // プロフィールテーブルがない場合は作成する
  const setupResult = await ensureProfilesTable();
  console.log("プロフィールテーブル設定:", setupResult);

  const { user, profile } = await getUserProfile();

  // ミドルウェアで認証チェックしているので、ここでのリダイレクト処理は不要
  // もし万が一のためのフォールバック処理として残したい場合はコメントを外してください
  // if (!user) {
  //   redirect(`/${locale}/sign-in`);
  // }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">プロフィール</h1>
      <ProfileClient initialProfile={profile} />
    </div>
  );
}
