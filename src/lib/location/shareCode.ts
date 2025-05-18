/**
 * 位置情報共有用のランダムコードを生成する
 * 
 * @param length コードの長さ（デフォルト: 6文字）
 * @returns ランダムな英数字コード
 */
export function generateShareCode(length: number = 6): string {
  // 数字とアルファベット（大文字）を使用
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // ランダムな文字を指定された長さだけ選択
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * 共有コードの有効期限を計算する
 * 
 * @param minutes 有効期限の分数（デフォルト: 60分 = 1時間）
 * @returns ISOフォーマットの日時文字列
 */
export function calculateExpiryDate(minutes: number = 60): string {
  const now = new Date();
  const expiry = new Date(now.getTime() + minutes * 60 * 1000);
  return expiry.toISOString();
}

/**
 * 共有コードが有効期限内かチェックする
 * 
 * @param expiryDateStr ISO形式の有効期限
 * @returns 有効期限内かどうか
 */
export function isShareCodeValid(expiryDateStr: string): boolean {
  const now = new Date();
  const expiryDate = new Date(expiryDateStr);
  return now < expiryDate;
}

/**
 * 共有コードが有効かどうかを検証する
 * @param shareCode 検証する共有コード
 */
export function validateShareCode(shareCode?: string): boolean {
  if (!shareCode) return false;
  
  // 長さチェック（3〜10文字）
  if (shareCode.length < 3 || shareCode.length > 10) return false;
  
  // 有効な文字のみ（アルファベット大文字と数字）を含むか
  const validCharPattern = /^[A-Z0-9]+$/;
  return validCharPattern.test(shareCode);
}

/**
 * 有効期限の残り時間を計算し、人間が読みやすい形式で返す
 * @param expiresAt 有効期限の日時
 */
export function getTimeUntilExpiry(expiresAt: Date | string): string {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  
  // 既に期限切れの場合
  if (now > expiry) {
    return '期限切れ';
  }
  
  const diffMs = expiry.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 60) {
    return `${diffMinutes}分`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}時間${minutes > 0 ? ` ${minutes}分` : ''}`;
  }
} 