import { Database, User } from './supabase';

// LocationsテーブルのRowのType
export type LocationRow = Database['public']['Tables']['locations']['Row'];
export type InsertLocationRow = Database['public']['Tables']['locations']['Insert'];
export type UpdateLocationRow = Database['public']['Tables']['locations']['Update'];

/**
 * 基本的な位置情報
 */
export interface GeoPosition {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
}

/**
 * 位置情報共有のデータ型
 */
export interface Location {
  id: string;
  user_id: string;
  share_code: string;
  title: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 位置情報共有作成時の入力データ型
 */
export interface LocationCreate {
  title?: string;
  description?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  expires_at?: string | null;
}

/**
 * 位置情報の更新用データ型
 */
export interface LocationUpdate {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  is_active?: boolean;
  expires_at?: string | null;
}

/**
 * 距離計算のための補助関数
 */
export interface DistanceResult {
  distance: number; // メートル単位
  bearing: number;  // 方位角（度）
}

/**
 * 共有位置情報と距離情報
 */
export interface LocationWithDistance extends Location {
  distance?: number;
  bearing?: number;
  creator?: User;
}

// 位置情報共有データ
export interface SharedLocation extends GeoPosition {
  id: string;
  user_id: string;
  share_code: string;
  location_name?: string | null;
  message?: string | null;
  expires_at: string; // ISO形式の日時文字列
  created_at: string;
  updated_at: string;
}

// 位置情報共有作成用入力データ型
export interface CreateSharedLocationInput {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  location_name?: string;
  message?: string;
  // 有効期限（分）、デフォルト値をAPIで設定
  expiresInMinutes?: number;
}

// 位置情報更新用入力データ型
export interface UpdateSharedLocationInput {
  latitude?: number;
  longitude?: number;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  location_name?: string;
  message?: string;
  expires_at?: string;
}

// 位置情報共有の成功レスポンス
export interface ShareLocationResponse {
  success: boolean;
  data?: SharedLocation;
  share_code?: string;
  error?: null;
}

// 位置情報共有のエラーレスポンス
export interface ShareLocationErrorResponse {
  success: false;
  data?: null;
  error: string;
} 