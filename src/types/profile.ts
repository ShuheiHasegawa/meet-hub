export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileResponse {
  success: boolean;
  data?: Profile;
  error?: string;
} 