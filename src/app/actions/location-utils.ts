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
  
  // 空白のみトリムし、大文字小文字はそのまま
  const trimmedCode = shareCode.trim();
  console.log("[共通] 位置情報検索:", trimmedCode);
  
  try {
    // 明示的にカラムを指定し、外部キー関連を避ける
    // エラーとなったカラムを削除（存在しないため）
    const { data, error } = await supabase
      .from('locations')
      .select(`
        id, share_code, latitude, longitude, 
        altitude, accuracy, heading,
        title, description, 
        is_active, expires_at, user_id,
        created_at, updated_at
      `)
      .eq('share_code', trimmedCode)
      .limit(1);
    
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
      return { 
        success: false, 
        data: null, 
        error: "指定された共有コードの位置情報が見つかりませんでした" 
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
      error: null 
    };
  } catch (error) {
    console.error("[共通] 予期せぬエラー:", error);
    return { 
      success: false, 
      data: null, 
      error: `位置情報の取得中にエラーが発生しました: ${(error as Error).message}` 
    };
  }
} 