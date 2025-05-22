"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureLocationsTable } from "./setup-locations";
import { LocationCreate, LocationUpdate } from "@/types/location";
import { nanoid } from "nanoid";

/**
 * ユニークな共有コードを生成
 */
async function generateUniqueShareCode(length: number = 6): Promise<string> {
  const supabase = createClient();
  let isUnique = false;
  let shareCode = "";
  
  // ユニークな共有コードが生成されるまで繰り返す
  while (!isUnique) {
    shareCode = nanoid(length);
    
    // 同じコードが存在するか確認
    const { data, error } = await supabase
      .from("locations")
      .select("id")
      .eq("share_code", shareCode)
      .single();
      
    isUnique = !data && !error;
  }
  
  return shareCode;
}

/**
 * 新しい位置情報を作成して共有
 */
export async function createSharedLocation(locationData: LocationCreate | LocationCreate[]) {
  console.log("createSharedLocation 開始");
  
  // null check
  if (!locationData) {
    console.error("無効なデータ: データがnullまたはundefined");
    return { 
      success: false, 
      error: "無効なデータ: データが指定されていません", 
      code: "invalid_data" 
    };
  }
  
  // データのログ出力（デバッグ用）
  console.log("受信データ:", JSON.stringify(locationData));
  
  // テーブルの存在を確認 - 単純なクエリで代替
  try {
    console.log("テーブルの存在を確認します");
    const supabase = createClient();
    const { error } = await supabase
      .from('locations')
      .select('id')
      .limit(1);
      
    if (error && error.code === '42P01') {
      console.error("テーブルが存在しません:", error);
      return { 
        success: false, 
        error: "位置情報テーブルが見つかりません。管理者にお問い合わせください。",
        code: "table_missing"
      };
    }
    
    console.log("位置情報テーブルは既に存在します");
  } catch (tableError) {
    console.error("テーブル確認エラー:", tableError);
    return { 
      success: false, 
      error: `テーブル確認エラー: ${(tableError as Error).message}`,
      code: "table_error"
    };
  }
  
  try {
    console.log("Supabaseクライアント作成");
    const supabase = createClient();
    
    // ユーザー情報を取得
    console.log("ユーザー認証情報取得");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("認証エラー:", userError);
      return { 
        success: false, 
        error: "認証エラー: ログインが必要です",
        code: "auth_required"
      };
    }

    console.log("認証済みユーザー:", user.id);
    
    // 配列の場合は最初の要素を取り出す
    const rawData = Array.isArray(locationData) ? locationData[0] : locationData;
    
    // 緯度経度のバリデーション
    if (
      (typeof rawData.latitude !== 'number' && typeof rawData.latitude !== 'string') || 
      (typeof rawData.longitude !== 'number' && typeof rawData.longitude !== 'string') ||
      isNaN(Number(rawData.latitude)) || 
      isNaN(Number(rawData.longitude))
    ) {
      console.error("無効な位置データ:", { lat: rawData.latitude, lng: rawData.longitude });
      return { 
        success: false, 
        error: "緯度・経度は有効な数値である必要があります",
        code: "invalid_coordinates"
      };
    }
    
    // 文字列の "$undefined" をnullに変換 & 型変換の安全性確保
    console.log("データの正規化");
    const sanitizedData = {
      title: rawData.title || "",
      description: rawData.description || "",
      latitude: Number(rawData.latitude),
      longitude: Number(rawData.longitude),
      // $undefinedを明示的にnullに変換
      altitude: 
        rawData.altitude === undefined ? null :
        String(rawData.altitude) === "$undefined" ? null : 
        typeof rawData.altitude === 'number' ? rawData.altitude : 
        typeof rawData.altitude === 'string' ? 
          (rawData.altitude === "" ? null : Number(rawData.altitude)) : null,
      accuracy: 
        rawData.accuracy === undefined ? null :
        String(rawData.accuracy) === "$undefined" ? null : 
        typeof rawData.accuracy === 'number' ? rawData.accuracy : 
        typeof rawData.accuracy === 'string' ? 
          (rawData.accuracy === "" ? null : Number(rawData.accuracy)) : null,
      heading: 
        rawData.heading === undefined ? null :
        String(rawData.heading) === "$undefined" ? null : 
        typeof rawData.heading === 'number' ? rawData.heading : 
        typeof rawData.heading === 'string' ? 
          (rawData.heading === "" ? null : Number(rawData.heading)) : null
    };
    
    // 共有コードを生成
    console.log("共有コード生成");
    const shareCode = await generateUniqueShareCode();
    
    // 期限を設定（デフォルト24時間）
    const expiresAt = rawData.expires_at || 
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    console.log("位置情報をデータベースに保存");
    // 位置情報を保存
    const insertData = {
      user_id: user.id,
      share_code: shareCode,
      title: sanitizedData.title || null,
      description: sanitizedData.description || null,
      latitude: sanitizedData.latitude,
      longitude: sanitizedData.longitude,
      altitude: sanitizedData.altitude,
      accuracy: sanitizedData.accuracy,
      heading: sanitizedData.heading,
      is_active: true,
      expires_at: expiresAt
    };
    
    console.log("挿入データ:", JSON.stringify(insertData));
    
    const { data, error } = await supabase
      .from("locations")
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error("位置情報保存エラー:", error);
      return { 
        success: false, 
        error: `位置情報の保存に失敗しました: ${error.message}`,
        code: "save_failed"
      };
    }
    
    console.log("位置情報の保存成功:", data.id);
    return { 
      success: true, 
      shareCode, 
      location: data 
    };
  } catch (error) {
    console.error("位置情報共有エラー:", error);
    return { 
      success: false, 
      error: `位置情報の共有に失敗しました: ${(error as Error).message}`,
      code: "unknown_error"
    };
  }
}

/**
 * 共有コードから位置情報を取得
 */
export async function getSharedLocation(code: string) {
  // 共通のユーティリティ関数を使用
  const { success, data, error } = await import('./location-utils').then(module => 
    module.fetchLocationByShareCode(code)
  );
  
  // ユーティリティの結果を期待する形式に変換
  return {
    success,
    location: data,
    error
  };
}

/**
 * 位置情報を更新
 */
export async function updateLocation(locationId: string, updateData: LocationUpdate) {
  try {
    const supabase = createClient();
    
    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: "認証エラー: ログインが必要です",
        code: "auth_required"
      };
    }
    
    // 位置情報を更新
    const { data, error } = await supabase
      .from("locations")
      .update(updateData)
      .eq("id", locationId)
      .eq("user_id", user.id) // 自分の位置情報のみ更新可能
      .select()
      .single();
    
    if (error) {
      console.error("位置情報更新エラー:", error);
      return { 
        success: false, 
        error: `位置情報の更新に失敗しました: ${error.message}`,
        code: "update_failed"
      };
    }
    
    return { 
      success: true, 
      location: data 
    };
  } catch (error) {
    console.error("位置情報更新エラー:", error);
    return { 
      success: false, 
      error: `位置情報の更新に失敗しました: ${(error as Error).message}`,
      code: "unknown_error"
    };
  }
}

/**
 * 共有を停止（非アクティブ化）
 */
export async function deactivateLocation(locationId: string) {
  try {
    const supabase = createClient();
    
    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: "認証エラー: ログインが必要です",
        code: "auth_required"
      };
    }
    
    // 位置情報を非アクティブに更新
    const { error } = await supabase
      .from("locations")
      .update({ is_active: false })
      .eq("id", locationId)
      .eq("user_id", user.id); // 自分の位置情報のみ更新可能
    
    if (error) {
      console.error("位置情報非アクティブ化エラー:", error);
      return { 
        success: false, 
        error: `共有の停止に失敗しました: ${error.message}`,
        code: "deactivate_failed"
      };
    }
    
    return { 
      success: true, 
      message: "共有を停止しました"
    };
  } catch (error) {
    console.error("位置情報非アクティブ化エラー:", error);
    return { 
      success: false, 
      error: `共有の停止に失敗しました: ${(error as Error).message}`,
      code: "unknown_error"
    };
  }
}

/**
 * ユーザーの共有中の位置情報リストを取得
 */
export async function getUserLocations() {
  try {
    const supabase = createClient();
    
    // ユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: "認証エラー: ログインが必要です",
        code: "auth_required"
      };
    }
    
    // 位置情報リストを取得
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("位置情報リスト取得エラー:", error);
      return { 
        success: false, 
        error: `位置情報リストの取得に失敗しました: ${error.message}`,
        code: "fetch_failed"
      };
    }
    
    return { 
      success: true, 
      locations: data 
    };
  } catch (error) {
    console.error("位置情報リスト取得エラー:", error);
    return { 
      success: false, 
      error: `位置情報リストの取得に失敗しました: ${(error as Error).message}`,
      code: "unknown_error"
    };
  }
} 