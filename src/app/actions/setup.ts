"use server";

import { createClient } from "@/lib/supabase/server";
import fs from 'fs';
import path from 'path';

/**
 * プロフィールテーブルがない場合に作成するアクション
 */
export async function setupProfilesTable() {
  const supabase = createClient();
  
  try {
    // スキーマのSQL取得
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'supabase', 'schema_profiles.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // SQLの実行
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error("プロフィールテーブル作成エラー:", error);
      throw new Error(`プロフィールテーブルの作成に失敗しました: ${error.message}`);
    }
    
    return { success: true, message: "プロフィールテーブルを作成しました" };
  } catch (error) {
    console.error("セットアップエラー:", error);
    return { success: false, error: `セットアップエラー: ${(error as Error).message}` };
  }
}

/**
 * テーブルの存在を確認
 */
export async function checkIfTableExists(tableName: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.rpc('check_table_exists', { table_name: tableName });
    
    if (error) {
      console.error(`テーブル確認エラー (${tableName}):`, error);
      return { exists: false, error: error.message };
    }
    
    return { exists: !!data, error: null };
  } catch (error) {
    console.error(`テーブル確認例外 (${tableName}):`, error);
    return { exists: false, error: (error as Error).message };
  }
}

/**
 * プロフィールテーブルの存在を確認し、なければ作成するアクション
 */
export async function ensureProfilesTable() {
  // テーブルの存在チェック
  const { exists, error } = await checkIfTableExists('profiles');
  
  if (error) {
    return { success: false, error: `テーブル確認エラー: ${error}` };
  }
  
  // すでに存在する場合は何もしない
  if (exists) {
    return { success: true, message: "プロフィールテーブルは既に存在します" };
  }
  
  // テーブル作成
  return await setupProfilesTable();
} 