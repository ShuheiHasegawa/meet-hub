import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  // 共有コードをパラメータから取得
  const code = params.code;
  
  if (!code) {
    return Response.json({ error: "共有コードが指定されていません" });
  }
  
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("share_code", code);
      
    return Response.json({
      code,
      found: data && data.length > 0,
      count: data?.length || 0,
      error: error ? error.message : null,
      data: data && data.length > 0 ? {
        id: data[0].id,
        share_code: data[0].share_code,
        is_active: data[0].is_active
      } : null
    });
  } catch (error) {
    return Response.json({ 
      error: (error as Error).message 
    });
  }
} 