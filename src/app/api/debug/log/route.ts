/**
 * デバッグログ取得用APIエンドポイント
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  // クエリパラメータから共有コードを取得
  const shareCode = request.nextUrl.searchParams.get("code");
  
  if (!shareCode) {
    return NextResponse.json({ error: "共有コードが指定されていません" }, { status: 400 });
  }
  
  // Supabaseクライアント
  const supabase = createClient();
  
  try {
    // 1. まず元の関数と同じ処理で検索
    console.log("共有コード検索:", shareCode);
    
    // 空白のみトリム
    const trimmedCode = shareCode.trim();
    
    // 検索結果を取得
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('share_code', trimmedCode);
    
    // デバッグ情報
    const debugInfo = {
      code: trimmedCode,
      search_method: "eq (完全一致)",
      data_found: data && data.length > 0,
      row_count: data ? data.length : 0,
      has_error: !!error,
      error_message: error ? error.message : null,
      
      // 詳細なデータ（あれば）
      first_record: data && data.length > 0 ? {
        id: data[0].id,
        share_code: data[0].share_code,
        is_active: data[0].is_active,
        created_at: data[0].created_at,
        // センシティブでないデータのみ
      } : null,
      
      // その他のデバッグ情報
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(debugInfo);
  } catch (err) {
    return NextResponse.json({ 
      error: (err as Error).message,
      stack: (err as Error).stack
    }, { status: 500 });
  }
} 