import React from "react";
import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-red-600">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            認証処理中にエラーが発生しました。お手数ですが、再度サインインをお試しください。
          </p>
        </div>
        <div className="mt-8">
          <Link href="/sign-in">
            <span className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
              サインインページへ戻る
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
