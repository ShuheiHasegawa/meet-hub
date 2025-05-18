"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  MapPinIcon,
  ShareIcon,
  UserIcon,
  EyeIcon,
} from "lucide-react";
import Link from "next/link";

// ナビゲーション項目の型定義
type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

export default function BottomNavigation({ locale }: { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();

  // 特定のパスではナビゲーションを表示しない
  const hideNavPaths = ["/sign-in", "/sign-up", "/auth"];

  // 現在のパスが非表示リストに含まれているかチェック
  const shouldHideNav = hideNavPaths.some((path) => pathname.includes(path));

  // ナビゲーションを非表示にする場合
  if (shouldHideNav) {
    return null;
  }

  // ナビゲーション項目の定義
  const navItems: NavItem[] = [
    {
      name: "ホーム",
      href: `/${locale}`,
      icon: <HomeIcon className="h-6 w-6" />,
    },
    {
      name: "マップ",
      href: `/${locale}/map`,
      icon: <MapPinIcon className="h-6 w-6" />,
    },
    {
      name: "AR",
      href: `/${locale}/ar`,
      icon: <EyeIcon className="h-6 w-6" />,
    },
    {
      name: "共有",
      href: `/${locale}/share`,
      icon: <ShareIcon className="h-6 w-6" />,
    },
    {
      name: "設定",
      href: `/${locale}/profile`,
      icon: <UserIcon className="h-6 w-6" />,
    },
  ];

  // 現在のパスがアイテムのhrefと一致するかチェック
  const isActive = (href: string) => {
    // ベースパスの比較（例: /ja/share は /ja/share* にマッチ）
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full py-1 ${
              isActive(item.href) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              {item.icon}
              <span className="text-xs">{item.name}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* モバイルデバイスでのセーフエリア考慮 */}
      <div className="h-safe-area-bottom bg-background" />
    </nav>
  );
}
