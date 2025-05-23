/**
 * 位置情報共有機能の共通ユーティリティ関数
 */
"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * 共有コードから位置情報を取得する共通関数
 * この関数は外部キー関連のエラーを回避するよう最適化されています
 */
export async function fetchLocationByShareCode(shareCode: string) {
  if (!shareCode) return { success: false, error: "共有コードが指定されていません" };
  
  const supabase = createClient();
  
  // 認証状態を確認
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("[共通] 認証状態:", {
    hasUser: user ? true : false,
    userId: user?.id || 'なし',
    email: user?.email || 'なし',
    authError: authError?.message || null
  });
  
  // 空白のみトリム
  const trimmedCode = shareCode.trim();
  console.log("[共通] 位置情報検索:", trimmedCode);
  console.log("[共通] 元の入力:", shareCode);
  console.log("[共通] Supabaseクライアント設定確認:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
    timestamp: new Date().toISOString()
  });
  
  try {
    // Supabase接続テスト
    const { data: testData, error: testError } = await supabase
      .from('locations')
      .select('count', { count: 'exact', head: true });
    
    console.log("[共通] データベース接続テスト:", {
      success: !testError,
      count: testData || 0,
      error: testError?.message || null
    });
    
    // 明示的にカラムを指定し、外部キー関連を避ける
    // エラーとなったカラムを削除（存在しないため）
    console.log("[共通] クエリ実行開始:", { share_code: trimmedCode });
    
    // 大文字小文字を区別しない検索を試行
    const { data, error } = await supabase
      .from('locations')
      .select(`
        id, share_code, latitude, longitude, 
        altitude, accuracy, heading,
        title, description, 
        is_active, expires_at, user_id,
        created_at, updated_at
      `)
      .ilike('share_code', trimmedCode)
      .limit(1);
    
    console.log("[共通] クエリ実行結果:", {
      hasData: data ? data.length : 0,
      hasError: error ? true : false,
      errorMessage: error?.message || null,
      errorCode: error?.code || null
    });
    
    if (error) {
      console.error("[共通] 位置情報検索エラー:", error);
      return { 
        success: false, 
        data: null, 
        error: `位置情報の取得に失敗しました: ${error.message}` 
      };
    }
    
    if (!data || data.length === 0) {
      console.warn("[共通] 位置情報が見つかりません:", trimmedCode);
      
      // デバッグ用: 全体的な確認クエリ
      const { data: allData, error: allError } = await supabase
        .from('locations')
        .select('share_code, is_active, expires_at')
        .limit(10);
      
      console.log("[共通] デバッグ: 最近の位置情報:", {
        totalCount: allData ? allData.length : 0,
        sampleCodes: allData ? allData.map(d => d.share_code) : [],
        searchCode: trimmedCode
      });
      
      return { 
        success: false, 
        data: null, 
        error: "指定された共有コードの位置情報が見つかりませんでした",
        // デバッグ情報を追加
        debug: {
          searchCode: trimmedCode,
          originalInput: shareCode,
          timestamp: new Date().toISOString(),
          hasUser: user ? true : false,
          userEmail: user?.email || 'なし',
          queryResult: 'not_found',
          sampleCodes: allData ? allData.map(d => d.share_code) : [],
          totalRecords: allData ? allData.length : 0,
          authError: authError?.message || null
        }
      };
    }
    
    // 状態をログ出力
    console.log("[共通] 共有状態:", { 
      id: data[0].id, 
      active: data[0].is_active,
      expires: data[0].expires_at,
      now: new Date().toISOString()
    });
    
    // 最初のレコードを返す
    console.log("[共通] 位置情報を取得:", data[0].id);
    return { 
      success: true, 
      data: {
        ...data[0],
        // 型の互換性を確保
        title: data[0].title,
        description: data[0].description
      }, 
      error: null,
      // デバッグ情報を追加
      debug: {
        searchCode: trimmedCode,
        originalInput: shareCode,
        timestamp: new Date().toISOString(),
        hasUser: user ? true : false,
        userEmail: user?.email || 'なし',
        queryResult: 'success',
        recordCount: data.length,
        authError: authError?.message || null
      }
    };
  } catch (error) {
    console.error("[共通] 予期せぬエラー:", error);
    return { 
      success: false, 
      data: null, 
      error: `位置情報の取得中にエラーが発生しました: ${(error as Error).message}`,
      // デバッグ情報を追加
      debug: {
        searchCode: trimmedCode,
        originalInput: shareCode,
        timestamp: new Date().toISOString(),
        hasUser: user ? true : false,
        userEmail: user?.email || 'なし',
        queryResult: 'error',
        errorMessage: (error as Error).message,
        authError: authError?.message || null
      }
    };
  }
} 