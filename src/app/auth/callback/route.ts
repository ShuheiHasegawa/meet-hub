import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18n } from '@/lib/i18n'; // i18n設定をインポート
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin, hash } = requestUrl;
  const next = searchParams.get('next') ?? `/${i18n.defaultLocale}`;
  
  // Cookie情報を抽出（デバッグ用）
  const supabaseCookies = request.cookies.getAll()
    .filter(cookie => cookie.name.startsWith('sb-'))
    .map(cookie => ({ name: cookie.name, exists: true }));
    
  console.log("[Auth Callback] クッキー情報:", supabaseCookies);

  // エラーパラメータがあるか確認
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.error("[Auth Callback] OAuth エラー:", error, errorDescription);
    // エラー情報をエラーページに渡す
    const errorParams = new URLSearchParams();
    errorParams.append('error', error);
    if (errorDescription) {
      errorParams.append('error_description', errorDescription);
    }
    return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams.toString()}`);
  }

  // codeパラメータがある場合は、サーバーサイドでセッション取得を試みる
  const code = searchParams.get('code');
  
  // リダイレクト先を構築
  let redirectUrl = `${origin}${next}`;

  // URLハッシュがある場合、それを保持して次のリダイレクト先に渡す
  if (hash) {
    redirectUrl += hash;
    console.log("[Auth Callback] ハッシュ付きリダイレクト:", redirectUrl);
  }

  // Cookieを設定したレスポンスを作成
  const response = NextResponse.redirect(redirectUrl);
  
  if (code) {
    try {
      console.log("[Auth Callback] 認証コード検出、セッション交換を試みます");
      const supabase = createClient();
      
      // 重要: コードをセッションと交換する
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("[Auth Callback] セッション交換エラー:", error.message);
      } else {
        console.log("[Auth Callback] セッション交換成功:", {
          userId: data.session?.user.id,
          expiresAt: data.session?.expires_at 
            ? new Date(data.session.expires_at * 1000).toLocaleString() 
            : "不明"
        });
      }
    } catch (e) {
      console.error("[Auth Callback] 予期せぬエラー:", e);
    }
  }

  console.log("[Auth Callback] リダイレクト:", "next =", next, "hash =", hash || "なし");
  
  // セッション存在フラグを設定（デバッグ用）
  response.cookies.set('auth-callback-processed', 'true', { 
    path: '/', 
    maxAge: 60 * 5, // 5分間だけ有効
    httpOnly: true,
    sameSite: 'lax'
  });

  return response;
} 