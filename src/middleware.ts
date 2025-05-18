import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { i18n } from "@/lib/i18n";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // リクエストのパスを取得
  const pathname = req.nextUrl.pathname;
  
  // デバッグログ: ミドルウェア開始
  console.log("[Middleware] 実行開始:", { pathname });

  // 1. Supabaseセッションの更新
  let res = await updateSession(req);
  
  // セッション情報の取得を試みる
  let sessionLogInfo = "取得不可"; // デフォルト値
  try {
    const url = new URL("/api/auth/session", req.url);
    const sessionReq = new Request(url, {
      headers: req.headers,
      method: "GET",
    });
    sessionLogInfo = "取得試行済み";
  } catch (e) {
    sessionLogInfo = "エラー";
  }

  // 2. パスがルート (/) の場合、デフォルトロケールにリダイレクト
  if (pathname === '/') {
    console.log("[Middleware] ルートへのアクセスをリダイレクト:", { to: `/${i18n.defaultLocale}` });
    return NextResponse.redirect(new URL(`/${i18n.defaultLocale}`, req.url));
  }

  // プロフィールページへのアクセスを検出して認証状態をチェック
  if (pathname.includes('/profile')) {
    console.log("[Middleware] プロファイルページへのアクセス:", { 
      pathname,
      session: sessionLogInfo,
      cookies: req.cookies.getAll().map(c => ({ name: c.name, value: c.name.startsWith('sb-') ? '存在します' : 'その他' }))
    });

    // プロファイルページへのアクセス時、認証状態を確認
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // この関数はミドルウェアでセッションチェック時には使用されませんが、
            // Supabaseクライアントが期待する形式で実装しておく必要があります
            res.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            // 同上
            res.cookies.set({
              name,
              value: '',
              ...options,
            })
          }
        }
      }
    )

    try {
      const { data, error } = await supabase.auth.getSession()
      console.log("[Middleware] セッションチェック結果:", { 
        hasSession: !!data.session,
        errorMessage: error?.message
      });
      
      // セッションがなければサインインページにリダイレクト
      if (!data.session) {
        const locale = pathname.split('/')[1]; // パスからロケールを取得
        console.log("[Middleware] 未認証のためリダイレクト:", { to: `/${locale}/sign-in` });
        return NextResponse.redirect(new URL(`/${locale}/sign-in`, req.url));
      }
    } catch (error) {
      console.error("[Middleware] 認証エラー:", error);
      const locale = pathname.split('/')[1];
      return NextResponse.redirect(new URL(`/${locale}/sign-in`, req.url));
    }
  }

  // 3. サポートしているロケールの1つ、またはその他のプレフィックス (api, _next など) で始まらないパスの場合
  const pathnameHasLocale = i18n.locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // パスに有効なロケールがなく、特殊なプレフィックス (/api, /_next, /images など) でもない場合
  // 例: /sign-in, /auth/callback など
  if (!pathnameHasLocale && 
      !pathname.startsWith('/_next') && 
      !pathname.startsWith('/api') && 
      !pathname.startsWith('/images') && 
      !pathname.startsWith('/auth')) {
    
    // デバッグログ: ロケールなしのパスをリダイレクト
    console.log("[Middleware] ロケールなしのパスをリダイレクト:", { 
      from: pathname, 
      to: `/${i18n.defaultLocale}${pathname}` 
    });
    
    // デフォルトロケールを先頭に追加してリダイレクト
    return NextResponse.redirect(new URL(`/${i18n.defaultLocale}${pathname}`, req.url));
  }

  // デバッグログ: ミドルウェア終了
  console.log("[Middleware] 実行終了:", { pathname, modified: pathnameHasLocale });
  
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico).*)"],
}; 