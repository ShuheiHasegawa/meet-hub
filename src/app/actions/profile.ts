"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ProfileResponse } from "@/types/profile";

/**
 * プロフィール情報を取得する
 */
export async function getProfile(): Promise<ProfileResponse> {
  const supabase = createClient();
  
  // ユーザーIDを取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "認証されていません"
    };
  }
  
  // プロフィールの有無をチェック
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select()
    .eq('id', user.id)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116はデータなしエラー
    console.error("プロフィール取得エラー:", fetchError);
    return {
      success: false,
      error: `プロフィールの取得に失敗しました: ${fetchError.message}`
    };
  }
  
  return {
    success: true,
    data: existingProfile || null
  };
}

/**
 * プロフィール情報を更新する
 */
export async function updateProfile(formData: FormData): Promise<ProfileResponse> {
  try {
    const supabase = createClient();
    
    // ユーザー情報の取得
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: "認証されていません。サインインしてください。"
      };
    }
    
    const username = formData.get('username') as string;
    const displayName = formData.get('display_name') as string;
    const avatarUrl = formData.get('avatar_url') as string;
    
    // プロフィールの有無をチェック
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select()
      .eq('id', user.id)
      .single();
    
    let result;
    
    // プロフィールが存在しない場合は作成、ある場合は更新
    if (!existingProfile) {
      // プロフィール作成
      result = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username || null,
          display_name: displayName || null,
          avatar_url: avatarUrl || user.user_metadata?.avatar_url || null
        })
        .select()
        .single();
    } else {
      // プロフィール更新
      result = await supabase
        .from('profiles')
        .update({
          username: username || existingProfile.username,
          display_name: displayName || existingProfile.display_name,
          avatar_url: avatarUrl || existingProfile.avatar_url || user.user_metadata?.avatar_url
        })
        .eq('id', user.id)
        .select()
        .single();
    }
    
    if (result.error) {
      console.error("プロフィール更新エラー:", result.error);
      return {
        success: false,
        error: `プロフィールの更新に失敗しました: ${result.error.message}`
      };
    }
    
    // キャッシュを再検証
    revalidatePath('/profile');
    
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error("プロフィール更新エラー:", error);
    return {
      success: false,
      error: `プロフィールの更新に失敗しました: ${(error as Error).message}`
    };
  }
} 