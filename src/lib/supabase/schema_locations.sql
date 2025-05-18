-- locations テーブル: 位置情報の共有と記録
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  share_code TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS locations_user_id_idx ON locations(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS locations_share_code_idx ON locations(share_code);
CREATE INDEX IF NOT EXISTS locations_is_active_idx ON locations(is_active);

-- トリガー: 更新時にupdated_atを更新
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_locations_updated_at();

-- 期限切れの位置情報を自動的に非アクティブにする関数
CREATE OR REPLACE FUNCTION deactivate_expired_locations()
RETURNS void AS $$
BEGIN
  UPDATE locations
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- RLSポリシー設定
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 作成者は自分の位置情報を完全に管理可能
CREATE POLICY "Users can manage their own locations"
  ON locations
  FOR ALL
  USING (auth.uid() = user_id);

-- 共有位置情報は誰でも閲覧可能
CREATE POLICY "Anyone can view active shared locations"
  ON locations
  FOR SELECT
  USING (is_active = true); 