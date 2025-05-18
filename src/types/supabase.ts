import { User as SupabaseUser } from '@supabase/supabase-js'

// Auth user type extending Supabase user
export type User = SupabaseUser

// Profile type matching your database schema
export interface Profile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  updated_at?: string;
  created_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      locations: {
        Row: {
          id: string;
          user_id: string;
          share_code: string;
          latitude: number;
          longitude: number;
          altitude: number | null;
          accuracy: number | null;
          heading: number | null;
          speed: number | null;
          location_name: string | null;
          message: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          share_code: string;
          latitude: number;
          longitude: number;
          altitude?: number | null;
          accuracy?: number | null;
          heading?: number | null;
          speed?: number | null;
          location_name?: string | null;
          message?: string | null;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          share_code?: string;
          latitude?: number;
          longitude?: number;
          altitude?: number | null;
          accuracy?: number | null;
          heading?: number | null;
          speed?: number | null;
          location_name?: string | null;
          message?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // 他のテーブルがあればここに追加
    };
    Views: {
      // ビューがあればここに定義
    };
    Functions: {
      // 関数があればここに定義
    };
    Enums: {
      // 列挙型があればここに定義
    };
  };
} 