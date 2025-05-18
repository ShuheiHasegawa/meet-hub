"use server";

import { createClient } from "@/lib/supabase/server";
import fs from 'fs';
import path from 'path';

/**
 * 個別のSQLコマンドを実行する
 */
async function executeSql(sql: string, description: string) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`SQL実行エラー(${description}):`, error);
      throw error;
    }
    
    console.log(`SQL実行成功: ${description}`);
    return { success: true };
  } catch (error) {
    console.error(`SQL実行例外(${description}):`, error);
    throw error;
  }
}

/**
 * 位置情報テーブルを手動で作成する
 */
async function createLocationsTableManually() {
  try {
    console.log("手動でlocationsテーブルを作成しています...");
    
    // テーブル作成
    await executeSql(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        share_code TEXT UNIQUE NOT NULL,
        title TEXT,
        description TEXT,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        altitude DOUBLE PRECISION,
        accuracy DOUBLE PRECISION,
        heading DOUBLE PRECISION,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `, "テーブル作成");
    
    // インデックス作成
    await executeSql(
      "CREATE INDEX IF NOT EXISTS locations_user_id_idx ON locations(user_id)",
      "user_idインデックス作成"
    );
    
    await executeSql(
      "CREATE UNIQUE INDEX IF NOT EXISTS locations_share_code_idx ON locations(share_code)",
      "share_codeインデックス作成"
    );
    
    await executeSql(
      "CREATE INDEX IF NOT EXISTS locations_is_active_idx ON locations(is_active)",
      "is_activeインデックス作成"
    );
    
    // トリガー作成
    await executeSql(`
      CREATE OR REPLACE FUNCTION update_locations_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `, "更新トリガー関数作成");
    
    await executeSql(`
      CREATE TRIGGER update_locations_updated_at
      BEFORE UPDATE ON locations
      FOR EACH ROW
      EXECUTE FUNCTION update_locations_updated_at()
    `, "更新トリガー作成");
    
    // 期限切れ関数
    await executeSql(`
      CREATE OR REPLACE FUNCTION deactivate_expired_locations()
      RETURNS void AS $$
      BEGIN
        UPDATE locations
        SET is_active = false
        WHERE expires_at < now() AND is_active = true;
      END;
      $$ LANGUAGE plpgsql
    `, "期限切れ関数作成");
    
    // RLSポリシー
    await executeSql(
      "ALTER TABLE locations ENABLE ROW LEVEL SECURITY",
      "RLS有効化"
    );
    
    await executeSql(`
      CREATE POLICY "Users can manage their own locations"
      ON locations
      FOR ALL
      USING (auth.uid() = user_id)
    `, "RLSポリシー1");
    
    await executeSql(`
      CREATE POLICY "Anyone can view active shared locations"
      ON locations
      FOR SELECT
      USING (is_active = true)
    `, "RLSポリシー2");
    
    return { success: true, message: "位置情報テーブルを作成しました" };
  } catch (error) {
    console.error("テーブル作成エラー:", error);
    return { 
      success: false, 
      error: `テーブル作成エラー: ${(error as Error).message}` 
    };
  }
}

/**
 * 位置情報テーブルがない場合に作成するアクション
 */
export async function setupLocationsTable() {
  try {
    // まず定型スクリプトでの作成を試みる
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'supabase', 'schema_locations.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    const supabase = createClient();
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      console.error("スクリプトでのテーブル作成エラー:", error);
      console.log("手動でのテーブル作成を試みます");
      // 手動での作成を試みる
      return await createLocationsTableManually();
    }
    
    return { success: true, message: "位置情報テーブルを作成しました" };
  } catch (error) {
    console.error("セットアップエラー:", error);
    return { success: false, error: `セットアップエラー: ${(error as Error).message}` };
  }
}

/**
 * 位置情報テーブルの存在を確認し、なければ作成するアクション
 */
export async function ensureLocationsTable() {
  try {
    const supabase = createClient();
    
    // テーブルの存在を確認 - select クエリで確認
    try {
      console.log("テーブルの存在を確認します");
      const { error } = await supabase
        .from('locations')
        .select('id')
        .limit(1);
      
      // エラーがなければテーブルは存在する
      if (!error) {
        console.log("位置情報テーブルは既に存在します");
        return { success: true, message: "位置情報テーブルは既に存在します" };
      }
      
      // テーブルが存在しないエラーの場合は作成する
      console.log("テーブルが存在しないようです。", error.message);
      
    } catch (checkError) {
      console.error("テーブル確認中にエラーが発生しました:", checkError);
      console.warn("テーブルを作成する必要があると判断します");
    }
    
    // Supabaseの管理UIでマイグレーションを実行するように管理者に通知
    console.log("Supabaseの管理UIからlocationsテーブルを作成してください");
    return { 
      success: false, 
      error: `位置情報テーブルが見つかりません。Supabaseの管理UIからマイグレーションを実行してlocationsテーブルを作成してください。` 
    };
  } catch (error) {
    console.error("位置情報テーブル確認エラー:", error);
    return { success: false, error: `位置情報テーブル確認エラー: ${(error as Error).message}` };
  }
}

/**
 * 位置情報テーブルを直接SQLクエリで作成する
 */
async function createLocationsTableDirectSQL() {
  try {
    console.log("SQLクエリで位置情報テーブルを作成します");
    
    const supabase = createClient();
    
    // テーブル作成は個別に実行
    console.log("テーブル作成");
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        share_code TEXT UNIQUE NOT NULL,
        title TEXT,
        description TEXT,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        altitude DOUBLE PRECISION,
        accuracy DOUBLE PRECISION,
        heading DOUBLE PRECISION,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
      )
    `;
    const { error: createTableError } = await supabase.rpc('exec', { query: createTableSql });
    if (createTableError) console.error("テーブル作成エラー:", createTableError);
    
    // インデックス作成
    console.log("インデックス作成");
    const createIndexSql = `
      CREATE INDEX IF NOT EXISTS locations_user_id_idx ON locations(user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS locations_share_code_idx ON locations(share_code);
      CREATE INDEX IF NOT EXISTS locations_is_active_idx ON locations(is_active);
    `;
    const { error: createIndexError } = await supabase.rpc('exec', { query: createIndexSql });
    if (createIndexError) console.error("インデックス作成エラー:", createIndexError);
    
    // トリガー関数作成
    console.log("トリガー関数作成");
    const createTriggerFnSql = `
      CREATE OR REPLACE FUNCTION update_locations_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    const { error: createTriggerFnError } = await supabase.rpc('exec', { query: createTriggerFnSql });
    if (createTriggerFnError) console.error("トリガー関数作成エラー:", createTriggerFnError);
    
    // トリガー設定
    console.log("トリガー設定");
    const createTriggerSql = `
      DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
      CREATE TRIGGER update_locations_updated_at
      BEFORE UPDATE ON locations
      FOR EACH ROW
      EXECUTE FUNCTION update_locations_updated_at();
    `;
    const { error: createTriggerError } = await supabase.rpc('exec', { query: createTriggerSql });
    if (createTriggerError) console.error("トリガー設定エラー:", createTriggerError);
    
    // RLSポリシー設定
    console.log("RLS有効化");
    const enableRlsSql = `ALTER TABLE locations ENABLE ROW LEVEL SECURITY;`;
    const { error: enableRlsError } = await supabase.rpc('exec', { query: enableRlsSql });
    if (enableRlsError) console.error("RLS有効化エラー:", enableRlsError);
    
    // RLSポリシー1
    console.log("RLSポリシー1作成");
    const createPolicy1Sql = `
      DROP POLICY IF EXISTS "Users can manage their own locations" ON locations;
      CREATE POLICY "Users can manage their own locations"
        ON locations
        FOR ALL
        USING (auth.uid() = user_id);
    `;
    const { error: createPolicy1Error } = await supabase.rpc('exec', { query: createPolicy1Sql });
    if (createPolicy1Error) console.error("RLSポリシー1作成エラー:", createPolicy1Error);
    
    // RLSポリシー2
    console.log("RLSポリシー2作成");
    const createPolicy2Sql = `
      DROP POLICY IF EXISTS "Anyone can view active shared locations" ON locations;
      CREATE POLICY "Anyone can view active shared locations"
        ON locations
        FOR SELECT
        USING (is_active = true);
    `;
    const { error: createPolicy2Error } = await supabase.rpc('exec', { query: createPolicy2Sql });
    if (createPolicy2Error) console.error("RLSポリシー2作成エラー:", createPolicy2Error);
    
    return { success: true, message: "位置情報テーブルを作成しました" };
  } catch (error) {
    console.error("テーブル作成エラー:", error);
    return { 
      success: false, 
      error: `テーブル作成エラー: ${(error as Error).message}` 
    };
  }
} 