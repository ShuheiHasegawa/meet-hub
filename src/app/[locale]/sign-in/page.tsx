import AuthButtons from "@/components/AuthButtons";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h2 className="text-3xl font-bold">MeetHubへようこそ</h2>
          <p className="text-sm text-muted-foreground mt-2">
            ARで、もっとスムーズな待ち合わせを。
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <AuthButtons />
          <p className="text-xs text-center text-muted-foreground">
            サインインすることで、利用規約およびプライバシーポリシーに同意したものとみなされます。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
