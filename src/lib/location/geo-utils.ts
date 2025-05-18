import { GeoPosition, DistanceResult } from "@/types/location";

/**
 * 地球の半径（メートル）
 */
const EARTH_RADIUS = 6371000;

/**
 * 度数法をラジアンに変換
 */
export function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * ラジアンを度数法に変換
 */
export function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * 2つの位置情報間の距離（メートル）と方位角（度）を計算
 */
export function calculateDistanceAndBearing(
  from: GeoPosition,
  to: GeoPosition
): DistanceResult {
  // 緯度・経度をラジアンに変換
  const lat1 = toRadians(from.latitude);
  const lon1 = toRadians(from.longitude);
  const lat2 = toRadians(to.latitude);
  const lon2 = toRadians(to.longitude);
  
  // 距離の計算（ハーバーサイン公式）
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS * c; // メートル単位
  
  // 方位角の計算
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  
  let bearing = Math.atan2(y, x);
  bearing = toDegrees(bearing);
  bearing = (bearing + 360) % 360; // 0-360度に正規化
  
  return { distance, bearing };
}

/**
 * 相対的な方角を取得（例：北、北東、東 など）
 */
export function getRelativeDirection(bearing: number): string {
  const directions = [
    "北", "北北東", "北東", "東北東",
    "東", "東南東", "南東", "南南東",
    "南", "南南西", "南西", "西南西",
    "西", "西北西", "北西", "北北西"
  ];
  
  // bearing を 0-15 の範囲にマッピング（各方角は22.5度）
  const index = Math.round(bearing / 22.5) % 16;
  
  return directions[index];
}

/**
 * 表示用の距離文字列を取得
 */
export function getFormattedDistance(distance: number): string {
  if (distance < 1000) {
    // メートル単位で表示（小数点以下切り捨て）
    return `${Math.floor(distance)}m`;
  } else {
    // キロメートル単位で表示（小数点第一位まで）
    return `${(distance / 1000).toFixed(1)}km`;
  }
}

/**
 * 位置情報のシェアリンクを生成
 */
export function generateShareLink(shareCode: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/share/${shareCode}`;
}

/**
 * 2つの位置間の高低差を計算
 */
export function calculateAltitudeDifference(
  from: GeoPosition,
  to: GeoPosition
): number | null {
  // どちらかの高度情報がない場合はnullを返す
  if (from.altitude === null || from.altitude === undefined || 
      to.altitude === null || to.altitude === undefined) {
    return null;
  }
  
  // 高度の差（メートル）
  return to.altitude - from.altitude;
}

/**
 * デバイスの向きと位置情報から目標地点への矢印の角度を計算
 */
export function calculatePointerDirection(
  currentPosition: GeoPosition,
  targetPosition: GeoPosition,
  deviceHeading: number | null
): number {
  // 方位を計算
  const { bearing } = calculateDistanceAndBearing(currentPosition, targetPosition);
  
  // デバイスの向き情報がある場合は、それを考慮して相対角度を計算
  // デバイスが北（0度）を向いている場合、目標地点が東（90度）にあれば、矢印は右（90度）を指す
  // デバイスが東（90度）を向いている場合、目標地点が東（90度）にあれば、矢印は正面（0度）を指す
  if (deviceHeading !== null && deviceHeading !== undefined) {
    const relativeAngle = bearing - deviceHeading;
    
    // 角度を-180度から180度の範囲に正規化
    return ((relativeAngle + 540) % 360) - 180;
  }
  
  // デバイスの向き情報がない場合は、絶対方位をそのまま返す
  return bearing;
} 