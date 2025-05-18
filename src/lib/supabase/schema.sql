-- locations テーブル: ユーザーの位置情報を保存
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  share_code VARCHAR(10) NOT NULL UNIQUE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  location_name TEXT,
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS locations_user_id_idx ON locations(user_id);
CREATE INDEX IF NOT EXISTS locations_share_code_idx ON locations(share_code);
CREATE INDEX IF NOT EXISTS locations_expires_at_idx ON locations(expires_at);

-- トリガー: 更新時にupdated_atを更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシー(行レベルセキュリティ)の設定
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- 自分の位置情報は読み書き可能
CREATE POLICY "Users can read their own locations"
  ON locations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations"
  ON locations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations"
  ON locations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations"
  ON locations
  FOR DELETE
  USING (auth.uid() = user_id);

-- 共有コードがあれば誰でも読み取り可能（有効期限内のみ）
CREATE POLICY "Anyone can read locations with share code if not expired"
  ON locations
  FOR SELECT
  USING (expires_at > now()); 