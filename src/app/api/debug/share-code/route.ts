import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchLocationByShareCode } from '@/app/actions/location-utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ 
      error: 'コードが指定されていません', 
      requiredParam: 'code' 
    }, { status: 400 });
  }

  // 直接データベースにアクセスして確認
  const supabase = createClient();
  
  try {
    // 方法1: シンプルクエリ
    const { data: directData, error: directError } = await supabase
      .from('locations')
      .select('id, share_code, is_active')
      .eq('share_code', code);

    // 方法2: LIKE検索でも確認
    const { data: likeData, error: likeError } = await supabase
      .from('locations')
      .select('id, share_code, is_active')
      .like('share_code', `%${code}%`);

    // 方法3: 共通関数を使用
    const utilsResult = await fetchLocationByShareCode(code);

    // 詳細データ取得（存在する場合）
    let detailData = null;
    if (directData && directData.length > 0) {
      const { data: detail } = await supabase
        .from('locations')
        .select('*')
        .eq('id', directData[0].id)
        .single();
      
      detailData = detail;
    }

    // 大文字小文字バリエーション
    const upperCode = code.toUpperCase();
    const lowerCode = code.toLowerCase();
    
    const { data: upperData } = await supabase
      .from('locations')
      .select('id, share_code')
      .eq('share_code', upperCode);
      
    const { data: lowerData } = await supabase
      .from('locations')
      .select('id, share_code')
      .eq('share_code', lowerCode);

    return NextResponse.json({
      searchedCode: code,
      directSearch: {
        found: directData && directData.length > 0,
        count: directData?.length || 0,
        data: directData,
        error: directError
      },
      likeSearch: {
        found: likeData && likeData.length > 0,
        count: likeData?.length || 0,
        data: likeData,
        error: likeError
      },
      utils: {
        success: utilsResult.success,
        error: utilsResult.error
      },
      caseVariants: {
        upper: {
          code: upperCode,
          found: upperData && upperData.length > 0,
          data: upperData
        },
        lower: {
          code: lowerCode,
          found: lowerData && lowerData.length > 0,
          data: lowerData
        }
      },
      detail: detailData
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'データ取得エラー', 
      message: (error as Error).message 
    }, { status: 500 });
  }
} 