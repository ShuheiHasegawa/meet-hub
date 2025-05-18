"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * 認証状態を診断するためのデバッグ関数
 */
export async function checkAuthStatus() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Cookieの情報を取得
    const cookieStore = cookies();
    const authCookies = {
      accessToken: cookieStore.get('sb-access-token')?.value ? '存在します' : 'ありません',
      refreshToken: cookieStore.get('sb-refresh-token')?.value ? '存在します' : 'ありません',
    };
    
    // セッション情報も取得
    const { data: session } = await supabase.auth.getSession();
    
    return {
      success: true,
      isAuthenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        hasMeta: !!user.user_metadata,
        metaKeys: user.user_metadata ? Object.keys(user.user_metadata) : []
      } : null,
      error: error?.message,
      cookieInfo: authCookies,
      hasSession: !!session,
      sessionExpiresAt: session?.session?.expires_at
    };
  } catch (error) {
    console.error("認証状態チェックエラー:", error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
} 