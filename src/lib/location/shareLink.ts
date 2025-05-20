import { getLocaleFromPathname } from '@/lib/i18n/utils';

/**
 * ロケールを含む共有リンクを生成する
 */
export function getFullShareLink(shareCode: string): string {
  if (typeof window === 'undefined') return `/share/${shareCode}`;
  
  // 現在のパスからロケールを取得
  const locale = getLocaleFromPathname(window.location.pathname) || 'ja';
  
  // 正規化された形式でリンクを構築
  return `${window.location.origin}/${locale}/share/${shareCode}`;
}

/**
 * 共有コードからロケールを含むパスを生成
 */
export function getSharePath(shareCode: string, locale: string = 'ja'): string {
  return `/${locale}/share/${shareCode}`;
}
