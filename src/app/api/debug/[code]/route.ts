import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from('locations').select('*').eq('share_code', params.code);
  return Response.json({ data });
}
