"use client"

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Profile } from "@/types/supabase";

export function useProfile(initialProfile?: Profile) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // 初期化時にユーザーデータを即座に取得（非同期を待たない）
  useEffect(() => {
    // ローディングのタイムアウト設定
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("強制的にローディングを終了");
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // 初期化時のユーザー情報と設定のロード
  useEffect(() => {
    // データロード状態を追跡するためのフラグ
    let isMounted = true;

    async function loadInitialData() {
      try {
        // 1. 現在のユーザー情報を取得
        console.log("初期データロード開始");
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("ユーザー取得エラー:", userError);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        if (!user) {
          console.log("ユーザーが見つかりません");
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // ユーザー情報をセット
        if (isMounted) {
          console.log("ユーザー情報設定:", user.id);
          setUser(user);
        }
        
        // 2. 初期プロファイルが提供されていない場合のみクエリする
        if (!initialProfile && user) {
          try {
            console.log("プロファイル取得中:", user.id);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (profileError) {
              console.log("プロファイル取得エラー:", profileError.code, profileError.message);
              
              // データが見つからない場合、プロファイルを作成
              if (profileError.code === 'PGRST116') {
                try {
                  const newProfile = await createDefaultProfile(user);
                  if (isMounted && newProfile) {
                    setProfile(newProfile);
                  }
                } catch (e) {
                  console.error("プロファイル作成中のエラー:", e);
                }
              }
            } else if (profileData) {
              console.log("プロファイル取得成功:", profileData);
              if (isMounted) {
                setProfile(profileData);
              }
            }
          } catch (e) {
            console.error("プロファイルクエリエラー:", e);
          }
        }
      } catch (e) {
        console.error("初期データロード全体のエラー:", e);
      } finally {
        // 初期化完了
        if (isMounted) {
          console.log("初期化完了、ローディング解除");
          setInitialized(true);
          setLoading(false);
        }
      }
    }
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [supabase, initialProfile]);

  // デフォルトプロフィールの作成
  async function createDefaultProfile(user: User) {
    console.log("デフォルトプロファイル作成:", user.id);
    try {
      const defaultProfile = {
        id: user.id,
        user_id: user.id,
        username: user.email?.split('@')[0] || '',
        display_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();
        
      if (error) {
        console.error("プロファイル作成エラー:", error);
        return null;
      }
      
      console.log("プロファイル作成成功:", data);
      return data;
    } catch (error) {
      console.error("プロファイル作成例外:", error);
      return null;
    }
  }

  // 認証状態変更のサブスクリプション
  useEffect(() => {
    if (!initialized) return;
    
    console.log("認証状態サブスクリプション設定");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("認証状態変更:", event);
        
        // ユーザー情報を更新
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        // 認証状態が変わり、かつユーザーがある場合はプロファイル取得
        if (currentUser && !initialProfile) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
              
            if (error) {
              console.error("認証変更時のプロファイル取得エラー:", error);
            } else if (data) {
              setProfile(data);
            }
          } catch (e) {
            console.error("認証変更時のプロファイル処理エラー:", e);
          }
        } else if (!currentUser) {
          // ログアウト時はプロファイルをクリア
          setProfile(null);
        }
      }
    );

    return () => {
      console.log("認証サブスクリプション解除");
      subscription.unsubscribe();
    };
  }, [supabase, initialProfile, initialized]);

  return { user, profile, loading };
}
