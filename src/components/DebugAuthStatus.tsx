"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function DebugAuthStatus() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 現在のセッション情報を取得
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("認証状態取得エラー:", error);
        } else {
          setUser(data.user);
        }
      } catch (e) {
        console.error("認証チェックエラー:", e);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 本番環境では非表示にする
  if (process.env.NODE_ENV === "production") return null;

  // 小さめのデバッグパネルを画面右下に表示
  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        padding: "10px",
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        borderRadius: "5px",
        fontSize: "12px",
        zIndex: 9999,
        maxWidth: "400px",
        overflow: "auto",
        maxHeight: "200px",
      }}
    >
      <h4>認証状態デバッグ</h4>
      {loading ? (
        <p>読込中...</p>
      ) : user ? (
        <>
          <p>ログイン済み: {user.email}</p>
          <p>ID: {user.id}</p>
          <pre style={{ fontSize: "10px" }}>
            {JSON.stringify(user, null, 2).substring(0, 200)}...
          </pre>
        </>
      ) : (
        <p>未ログイン</p>
      )}
    </div>
  );
}
