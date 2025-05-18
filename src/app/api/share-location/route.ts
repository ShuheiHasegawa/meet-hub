import { NextRequest, NextResponse } from "next/server";
import { createSharedLocation } from "@/app/actions/location-actions";
import { createClient } from "@/lib/supabase/server";

// APIタイムアウト60秒（増加）
const API_TIMEOUT = 60000;

// 位置情報を受け取って保存するAPI
export async function POST(request: NextRequest) {
  console.log("API: 位置情報共有リクエスト受信");
  
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`API timeout after ${API_TIMEOUT}ms`));
    }, API_TIMEOUT);
  });
  
  try {
    // リクエストボディをパース
    const body = await request.json();
    console.log("API受信データ:", JSON.stringify(body));
    
    // 認証確認
    const supabase = createClient();
    console.log("API: Supabaseクライアント作成完了");
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log("API: 認証確認完了", user ? `ユーザーID: ${user.id.substring(0,8)}...` : "ユーザーなし");
    
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
    
    // 位置情報データ準備 - 明示的に型変換と$undefinedの処理を行う
    const locationData = {
      title: body.title || "",
      description: body.description || "",
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      // $undefinedを明示的にnullに変換
      altitude: body.altitude === "$undefined" ? null : 
               body.altitude !== undefined ? Number(body.altitude) : null,
      accuracy: body.accuracy === "$undefined" ? null : 
                body.accuracy !== undefined ? Number(body.accuracy) : null,
      heading: body.heading === "$undefined" ? null : 
               body.heading !== undefined ? Number(body.heading) : null,
    };
    
    console.log("API: 位置情報を保存します", JSON.stringify(locationData));
    
    // Promise.raceでタイムアウト処理
    const resultPromise = createSharedLocation(locationData);
    const result: any = await Promise.race([resultPromise, timeoutPromise]);
    
    // タイムアウトをクリア
    if (timer) clearTimeout(timer);
    
    console.log("API: 位置情報保存処理完了", JSON.stringify(result));
    
    if (!result || !result.success) {
      console.log("API: 位置情報の保存に失敗しました", result?.error || "不明なエラー");
      return NextResponse.json(
        { success: false, error: result?.error || "位置情報の保存に失敗しました" },
        { status: 500 }
      );
    }
    
    console.log("API: 位置情報の保存に成功しました", result.shareCode);
    return NextResponse.json({
      success: true,
      shareCode: result.shareCode,
      location: result.location
    });
  } catch (error) {
    console.error("API: 位置情報共有エラー", error);
    
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
    console.log("API: 位置情報共有処理完了");
    if (timer) clearTimeout(timer);
  }
} 