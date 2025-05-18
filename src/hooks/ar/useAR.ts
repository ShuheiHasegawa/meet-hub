"use client";

import { useState, useEffect, useRef } from 'react';
import { GeoPosition } from '@/types/location';

interface UseARProps {
  targetPosition?: GeoPosition;
  currentPosition?: GeoPosition;
}

interface ARState {
  isInitialized: boolean;
  isSupported: boolean;
  error: Error | null;
  bearing: number | null; // 方位角（対象への方角）
  distance: number | null; // メートル単位の距離
}

/**
 * AR表示を管理するカスタムフック
 */
export function useAR({ targetPosition, currentPosition }: UseARProps = {}) {
  const [arState, setARState] = useState<ARState>({
    isInitialized: false,
    isSupported: false,
    error: null,
    bearing: null,
    distance: null,
  });
  
  // カメラストリーム参照
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // ARコンテナ参照
  const containerRef = useRef<HTMLDivElement | null>(null);

  // サポートチェック
  useEffect(() => {
    // WebXR Device APIのサポート確認
    const isWebXRSupported = 'xr' in navigator;
    
    // DeviceOrientation APIのサポート確認（方角取得に使用）
    const isDeviceOrientationSupported = 'DeviceOrientationEvent' in window;
    
    // カメラアクセスのサポート確認
    const isCameraSupported = navigator.mediaDevices && 
      'getUserMedia' in navigator.mediaDevices;
    
    // 位置情報APIのサポート確認
    const isGeolocationSupported = 'geolocation' in navigator;
    
    const isSupported = isWebXRSupported || 
      (isDeviceOrientationSupported && isCameraSupported && isGeolocationSupported);
    
    setARState(prev => ({
      ...prev,
      isSupported,
      error: !isSupported ? new Error('AR機能がお使いの端末でサポートされていません') : null
    }));
  }, []);

  // AR初期化関数
  const initializeAR = async (containerElement: HTMLDivElement, videoElement: HTMLVideoElement) => {
    if (!arState.isSupported) {
      return;
    }
    
    try {
      containerRef.current = containerElement;
      videoRef.current = videoElement;
      
      // カメラストリームの取得
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // 背面カメラ
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight }
        }
      });
      
      // ビデオ要素にストリームをセット
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // 方位の取得開始（DeviceOrientation APIを使用）
      window.addEventListener('deviceorientation', handleOrientation);
      
      setARState(prev => ({
        ...prev,
        isInitialized: true
      }));
    } catch (error) {
      setARState(prev => ({
        ...prev,
        error: error as Error
      }));
    }
  };

  // 方位角イベントハンドラ
  const handleOrientation = (event: DeviceOrientationEvent) => {
    // iOS用（safariではrequestPermissionが必要）
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        })
        .catch(console.error);
    }
    
    // コンパス値（alpha）を使用
    if (event.alpha !== null) {
      // 方位角の処理（今後拡張）
    }
  };

  // 2点間の距離と方位角を計算
  useEffect(() => {
    if (currentPosition && targetPosition) {
      // 距離計算（ヒュベニの公式）
      const distance = calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        targetPosition.latitude,
        targetPosition.longitude
      );
      
      // 方位角計算
      const bearing = calculateBearing(
        currentPosition.latitude,
        currentPosition.longitude,
        targetPosition.latitude,
        targetPosition.longitude
      );
      
      setARState(prev => ({
        ...prev,
        distance,
        bearing
      }));
    }
  }, [currentPosition, targetPosition]);

  // ヒュベニの距離計算式（メートル単位）
  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371e3; // 地球の半径（メートル）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // 方位角計算（真北からの角度、0〜360度）
  const calculateBearing = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const λ1 = lon1 * Math.PI / 180;
    const λ2 = lon2 * Math.PI / 180;

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    
    // 0〜360度の範囲に収める
    brng = (brng + 360) % 360;
    
    return brng;
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      // カメラストリームの停止
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      // イベントリスナーの削除
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return {
    ...arState,
    initializeAR,
    containerRef,
    videoRef
  };
} 