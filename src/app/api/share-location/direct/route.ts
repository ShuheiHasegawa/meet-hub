import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShareCode } from '@/lib/location/shareCode';
import { getLocaleFromPathname } from '@/lib/i18n/utils';

// APIタイムアウト30秒
const API_TIMEOUT = 30000;

// 位置情報を直接保存するAPI
export async function POST(request: NextRequest) {
  console.log("[DirectAPI] 位置情報共有リクエスト受信");
  
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`API timeout after ${API_TIMEOUT}ms`));
    }, API_TIMEOUT);
  });
  
  try {
    // リクエストからロケールを取得
    const locale = getLocaleFromPathname(request.nextUrl.pathname) || 'ja';

    // リクエストボディをパース
    const body = await request.json();
    console.log("[DirectAPI] 受信データ:", JSON.stringify(body));
    
    // 認証確認
    const supabase = createClient();
    console.log("[DirectAPI] Supabaseクライアント作成完了");
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log("[DirectAPI] 認証確認完了", user ? `ユーザーID: ${user.id.substring(0,8)}...` : "ユーザーなし");
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // 位置情報のバリデーション
    if (!body || !body.latitude || !body.longitude) {
      return NextResponse.json(
        { success: false, error: "位置情報が不足しています" },
        { status: 400 }
      );
    }

    // 位置情報データ準備 - 明示的に型変換と$undefinedの処理
    const locationData = {
      title: body.title || "",
      description: body.description || "",
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      altitude: body.altitude === "$undefined" ? null : 
               body.altitude !== undefined ? Number(body.altitude) : null,
      accuracy: body.accuracy === "$undefined" ? null : 
                body.accuracy !== undefined ? Number(body.accuracy) : null,
      heading: body.heading === "$undefined" ? null : 
               body.heading !== undefined ? Number(body.heading) : null,
    };
    
    console.log("[DirectAPI] 処理データ:", JSON.stringify(locationData));

    // 独自に共有コードを生成
    const shareCode = generateShareCode();
    console.log("[DirectAPI] 生成された共有コード:", shareCode);
    
    // 期限を設定（デフォルト24時間）
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // データ挿入準備
    const insertData = {
      user_id: user.id,
      share_code: shareCode,
      title: locationData.title || null,
      description: locationData.description || null,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      altitude: locationData.altitude,
      accuracy: locationData.accuracy,
      heading: locationData.heading,
      is_active: true,
      expires_at: expiresAt
    };
    
    console.log("[DirectAPI] 挿入データ:", JSON.stringify(insertData));
    
    // Promise.raceでタイムアウト処理
    const insertPromise = supabase
      .from("locations")
      .insert(insertData)
      .select()
      .single();
    
    const result: any = await Promise.race([insertPromise, timeoutPromise]);
    
    // タイムアウトをクリア
    if (timer) clearTimeout(timer);
    
    console.log("[DirectAPI] 位置情報保存処理完了", JSON.stringify(result));
    
    if (result.error) {
      console.error("[DirectAPI] 位置情報の保存に失敗しました", result.error);
      return NextResponse.json(
        { success: false, error: `位置情報の保存に失敗しました: ${result.error.message}` },
        { status: 500 }
      );
    }
    
    console.log("[DirectAPI] 位置情報の保存に成功しました", shareCode);
    return NextResponse.json({
      success: true,
      shareCode: shareCode,
      data: result.data,
      locale,
      link: `/${locale}/share/${shareCode}`
    });
  } catch (error) {
    console.error("[DirectAPI] 位置情報共有エラー", error);
    
    // タイムアウトエラーの場合
    if ((error as Error).message.includes('API timeout')) {
      return NextResponse.json(
        { success: false, error: "処理がタイムアウトしました。しばらく経ってからもう一度お試しください。" },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  } finally {
    console.log("[DirectAPI] 位置情報共有処理完了");
    if (timer) clearTimeout(timer);
  }
} 