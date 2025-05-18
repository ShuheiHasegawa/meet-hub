"use client";

import { useState, useEffect, useCallback } from "react";
import type { GeoPosition } from "@/types/location";

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

interface GeolocationState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  watchId: number | null;
}

/**
 * ブラウザの位置情報APIを使用して現在地を取得するカスタムフック
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
    watchId: null,
  });

  // 位置情報を一度だけ取得
  const getCurrentPosition = useCallback(() => {
    // ブラウザが位置情報APIに対応しているかチェック
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: 'このブラウザは位置情報の取得に対応していません。', 
        loading: false 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      // 成功コールバック
      position => {
        const { latitude, longitude, altitude, accuracy, heading } = position.coords;
        
        setState(prev => ({
          ...prev,
          position: {
            latitude,
            longitude,
            altitude: altitude || null,
            accuracy: accuracy || null,
            heading: heading || null
          },
          loading: false,
          error: null
        }));
      },
      // エラーコールバック
      error => {
        let errorMsg = '位置情報の取得に失敗しました。';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = '位置情報へのアクセスが拒否されました。ブラウザの設定で許可してください。';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = '現在地が取得できませんでした。';
            break;
          case error.TIMEOUT:
            errorMsg = '位置情報の取得がタイムアウトしました。';
            break;
        }
        
        setState(prev => ({ ...prev, error: errorMsg, loading: false }));
      },
      // オプション
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // 位置情報のリアルタイム監視を開始
  const startWatching = useCallback(() => {
    // 既に監視中なら何もしない
    if (state.watchId !== null) return;

    // ブラウザが位置情報APIに対応しているかチェック
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: 'このブラウザは位置情報の取得に対応していません。', 
        loading: false 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // 位置情報の監視を開始
    const watchId = navigator.geolocation.watchPosition(
      // 成功コールバック
      position => {
        const { latitude, longitude, altitude, accuracy, heading } = position.coords;
        
        setState(prev => ({
          ...prev,
          position: {
            latitude,
            longitude,
            altitude: altitude || null,
            accuracy: accuracy || null,
            heading: heading || null
          },
          loading: false,
          error: null,
          watchId
        }));
      },
      // エラーコールバック
      error => {
        let errorMsg = '位置情報の監視中にエラーが発生しました。';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = '位置情報へのアクセスが拒否されました。ブラウザの設定で許可してください。';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = '現在地が取得できませんでした。';
            break;
          case error.TIMEOUT:
            errorMsg = '位置情報の監視中にタイムアウトしました。';
            break;
        }
        
        setState(prev => ({ ...prev, error: errorMsg, loading: false }));
      },
      // オプション
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setState(prev => ({ ...prev, watchId }));

    return watchId;
  }, [state.watchId]);

  // 位置情報の監視を停止
  const stopWatching = useCallback(() => {
    if (state.watchId !== null) {
      navigator.geolocation.clearWatch(state.watchId);
      setState(prev => ({ ...prev, watchId: null }));
    }
  }, [state.watchId]);

  // コンポーネントのアンマウント時に監視を停止
  useEffect(() => {
    return () => {
      if (state.watchId !== null) {
        navigator.geolocation.clearWatch(state.watchId);
      }
    };
  }, [state.watchId]);

  return {
    position: state.position,
    loading: state.loading,
    error: state.error,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: state.watchId !== null
  };
} 