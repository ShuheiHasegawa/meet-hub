import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const shareCode = request.nextUrl.searchParams.get("code");
  
  if (!shareCode) {
    return NextResponse.json({ error: "共有コードが指定されていません" }, { status: 400 });
  }
  
  // 正規化
  const normalizedCode = shareCode.trim().toUpperCase();
  
  // Supabaseクライアント
  const supabase = createClient();
  
  try {
    // RLSをバイパスせず、直接クエリ
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('share_code', normalizedCode);
    
    return NextResponse.json({
      code: normalizedCode,
      data: data,
      error: error,
      hasData: data && data.length > 0
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}