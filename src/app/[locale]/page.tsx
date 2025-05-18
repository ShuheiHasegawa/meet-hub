import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShareIcon, MapPinIcon, UserIcon } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  // サーバーサイドでユーザー認証状態を確認
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ロケールを含むパスを生成
  const localePath = (path: string) => `/${params.locale}${path}`;

  return (
    <div className="container mx-auto py-8 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">MeetHub</h1>
        <p className="text-xl text-muted-foreground">
          簡単に位置情報を共有して、待ち合わせをスムーズに
        </p>
      </div>

      {!user ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-center mb-4">
            サインインして位置情報の共有を始めましょう
          </p>
          <Link href={localePath("/sign-in")}>
            <Button size="lg">サインイン</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <ShareIcon className="h-5 w-5 mr-2" />
                位置情報の共有
              </CardTitle>
              <CardDescription>
                位置情報を共有して、友達との待ち合わせを簡単に
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-2">
                共有コードを生成して、あなたの現在地を安全に共有できます。
                有効期限を設定して、プライバシーを守りながら共有できます。
              </div>
              <Link href={localePath("/share")}>
                <Button className="w-full mt-2">位置情報を共有する</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                地図表示
              </CardTitle>
              <CardDescription>
                共有された位置情報を地図上で確認
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-2">
                友達が共有した位置情報を地図上で簡単に確認できます。
                共有コードを入力するだけで、待ち合わせ場所がすぐに分かります。
              </div>
              <Link href={localePath("/map")}>
                <Button className="w-full mt-2" variant="secondary">
                  地図を表示する
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
