import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

export const getUserProfile = cache(async () => {
  const supabase = createClient()
  
  try {
    // ユーザー認証情報取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log("============= getUserProfile =============")
    console.log("userError:", userError?.message)
    console.log("sessionError:", sessionError?.message)
    console.log("session exists:", !!session)
    console.log("user from getUser:", user?.id)
    console.log("user from session:", session?.user?.id)
    console.log("=========================================")
    
    // セッションがあるがgetUserがnullの場合はセッションのユーザーを使用
    const authUser = user || (session ? session.user : null)
    
    if (!authUser) return { user: null, profile: null }
    
    // プロフィール情報取得
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single()
    
    return { user: authUser, profile }
  } catch (error) {
    console.error("Profile fetch error:", error)
    return { user: null, profile: null }
  }
})
