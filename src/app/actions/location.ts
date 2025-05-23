"use server";

import { createClient } from "@/lib/supabase/server";
import { generateShareCode, calculateExpiryDate, validateShareCode } from "@/lib/location/shareCode";
import { revalidatePath } from "next/cache";
import type { 
  CreateSharedLocationInput,
  UpdateSharedLocationInput,
  SharedLocation,
  ShareLocationResponse,
  ShareLocationErrorResponse
} from "@/types/location";

/**
 * 位置情報を共有し、共有コードを返す
 */
// 関数オーバーロード定義
export async function shareLocation(input: CreateSharedLocationInput): Promise<ShareLocationResponse | ShareLocationErrorResponse>;
export async function shareLocation(formData: FormData): Promise<ShareLocationResponse | ShareLocationErrorResponse>;

// 実装
export async function shareLocation(input: CreateSharedLocationInput | FormData): Promise<ShareLocationResponse | ShareLocationErrorResponse> {
  const supabase = createClient();
  
  // ユーザーIDを取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "認証されていません"
    };
  }

  try {
    // フォームデータか入力オブジェクトかを判定して処理
    if (input instanceof FormData) {
      // FormData版の処理
      const shareCode = input.get('shareCode') as string || generateShareCode(6);
      const latitude = parseFloat(input.get('latitude') as string);
      const longitude = parseFloat(input.get('longitude') as string);
      const accuracy = input.get('accuracy') ? parseFloat(input.get('accuracy') as string) : null;
      const altitude = input.get('altitude') ? parseFloat(input.get('altitude') as string) : null;
      const heading = input.get('heading') ? parseFloat(input.get('heading') as string) : null;
      const speed = input.get('speed') ? parseFloat(input.get('speed') as string) : null;
      const expiresAt = input.get('expiresAt') as string || calculateExpiryDate(60);
      const title = input.get('title') as string || null;
      const description = input.get('description') as string || null;
      
      // 共有コードのバリデーション
      if (!validateShareCode(shareCode)) {
        return {
          success: false,
          error: "無効な共有コードです"
        };
      }
      
      // データ挿入
      const { data, error } = await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          share_code: shareCode,
          latitude,
          longitude,
          accuracy,
          altitude,
          heading,
          speed,
          title,
          description,
          expires_at: expiresAt
        })
        .select()
        .single();
      
      if (error) {
        console.error("位置情報の共有エラー:", error);
        if (error.code === '23505') {
          return {
            success: false,
            error: "この共有コードは既に使用されています"
          };
        }
        return {
          success: false,
          error: `位置情報の共有に失敗しました: ${error.message}`
        };
      }
      
      // キャッシュを再検証
      revalidatePath("/share");
      
      return { 
        success: true,
        data,
        share_code: shareCode
      };
    } else {
      // CreateSharedLocationInput版の処理
      const shareCode = generateShareCode(6);
      const expiresAt = calculateExpiryDate(input.expiresInMinutes || 60);
      
      // データ挿入
      const { data, error } = await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          share_code: shareCode,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy || null,
          altitude: input.altitude || null,
          heading: input.heading || null,
          speed: input.speed || null,
          title: input.title || null,
          description: input.description || null,
          expires_at: expiresAt
        })
        .select()
        .single();
      
      if (error) {
        console.error("位置情報の共有エラー:", error);
        return {
          success: false,
          error: `位置情報の共有に失敗しました: ${error.message}`
        };
      }
      
      // キャッシュを再検証
      revalidatePath("/share");
      
      return {
        success: true,
        data,
        share_code: shareCode
      };
    }
  } catch (error) {
    console.error("位置情報の共有に失敗しました:", error);
    return {
      success: false,
      error: `位置情報の共有に失敗しました: ${(error as Error).message}`
    };
  }
}

/**
 * 共有コードから位置情報を取得する
 */
export async function getLocationByShareCode(shareCode: string): Promise<ShareLocationResponse | ShareLocationErrorResponse> {
  console.log(`[ACTION] getLocationByShareCode呼び出し: "${shareCode}"`);
  
  try {
    // 共通のユーティリティ関数を使用
    const result = await import('./location-utils').then(module => 
      module.fetchLocationByShareCode(shareCode)
    );
    
    console.log(`[ACTION] location-utilsの結果:`, {
      success: result.success,
      hasData: result.data ? true : false,
      error: result.error
    });
    
    // location-utilsの結果をそのまま返す（応答形式は既に統一されている）
    return result as ShareLocationResponse | ShareLocationErrorResponse;
  } catch (error) {
    console.error(`[ACTION] 予期せぬエラー:`, error);
    return {
      success: false,
      error: `位置情報の取得中にエラーが発生しました: ${(error as Error).message}`
    } as ShareLocationErrorResponse;
  }
}

/**
 * ユーザーの共有している位置情報リストを取得する
 */
export async function getMyLocations(): Promise<{
  success: boolean;
  data?: SharedLocation[];
  error?: string;
}> {
  const supabase = createClient();
  
  // ユーザーIDを取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "認証されていません。サインインしてください。"
    };
  }
  
  // ユーザーの位置情報を取得
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("位置情報の取得エラー:", error);
    return {
      success: false,
      error: `位置情報の取得に失敗しました: ${error.message}`
    };
  }
  
  return {
    success: true,
    data: data as SharedLocation[],
  };
}

/**
 * 位置情報を更新する
 */
export async function updateLocation(
  locationId: string,
  data: UpdateSharedLocationInput
): Promise<ShareLocationResponse | ShareLocationErrorResponse> {
  try {
    const supabase = createClient();

    // 現在のユーザー情報を取得
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: "認証されていません。サインインしてください。"
      };
    }

    // 位置情報を更新
    const { data: location, error } = await supabase
      .from("locations")
      .update({
        ...data,
      })
      .eq("id", locationId)
      .eq("user_id", user.id) // 所有者チェック
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `位置情報の更新に失敗しました: ${error.message}`
      };
    }

    // キャッシュを再検証
    revalidatePath("/share");
    
    return {
      success: true,
      data: location as SharedLocation,
    };
  } catch (error) {
    console.error("位置情報の更新に失敗しました:", error);
    return {
      success: false,
      error: `位置情報の更新に失敗しました: ${(error as Error).message}`
    };
  }
}

/**
 * 位置情報を削除する
 */
export async function deleteLocation(locationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  // ユーザーIDを取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "認証されていません。サインインしてください。"
    };
  }
  
  // 位置情報を削除（自分の位置情報のみ削除可能）
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error("位置情報の削除エラー:", error);
    return {
      success: false,
      error: `位置情報の削除に失敗しました: ${error.message}`
    };
  }
  
  // キャッシュを再検証
  revalidatePath("/share");
  
  return { success: true };
} 