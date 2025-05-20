import { i18n } from "@/lib/i18n";
import { Locale } from "@/lib/i18n";

/**
 * パス文字列からロケールを抽出する
 */
export function getLocaleFromPathname(pathname: string): string | undefined {
  if (!pathname) return undefined;
  
  // パスをセグメントに分割
  const segments = pathname.split('/').filter(Boolean);
  
  // 最初のセグメントがサポートされているロケールかチェック
  if (segments.length > 0 && i18n.locales.includes(segments[0] as Locale)) {
    return segments[0];
  }
  
  // デフォルトのロケールを返す
  return i18n.defaultLocale;
}
