"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Create a SQL execution RPC function in Supabase
 */
export async function createExecFunction() {
  const supabase = createClient();
  
  // テーブルと関数リストの取得（デバッグ用）
  const { data: tables, error: tablesError } = await supabase
    .from('pg_catalog.pg_tables')
    .select('schemaname,tablename')
    .eq('schemaname', 'public');
    
  if (tablesError) {
    console.error("テーブル一覧取得エラー:", tablesError);
  } else {
    console.log("Public スキーマのテーブル:", tables);
  }
  
  // SQL実行RPC関数を作成
  try {
    const { error } = await supabase.rpc('exec', { 
      query: `
        CREATE OR REPLACE FUNCTION exec(query text)
        RETURNS VOID AS $$
        BEGIN
          EXECUTE query;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (error) {
      console.error("SQL実行関数作成エラー:", error);
      
      // PostgreSQLの直接インターフェースを使用してSQL実行関数を作成
      // この方法はローカル環境や一部のSupabaseプランでは動作しない場合があります
      console.log("代替方法で関数を作成しています...");
      
      const { error: directError } = await supabase
        .from('_exec_sql')
        .insert({
          sql: `
            CREATE OR REPLACE FUNCTION exec(query text)
            RETURNS VOID AS $$
            BEGIN
              EXECUTE query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `
        });
        
      if (directError) {
        console.error("代替方法での関数作成エラー:", directError);
        return { success: false, error: directError.message };
      }
    }
    
    return { success: true, message: "SQL実行関数を作成しました" };
  } catch (error) {
    console.error("SQL実行関数作成中にエラーが発生しました:", error);
    return { success: false, error: (error as Error).message };
  }
} 