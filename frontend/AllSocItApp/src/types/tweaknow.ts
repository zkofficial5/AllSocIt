// Character types
export interface TweakNowCharacter {
  id: number;
  universe_id: number;
  name: string;
  username: string;
  banner_image?: string;
  bio?: string;
  location?: string;
  website?: string;
  birth_date?: string;
  pro_category?: string;
  official_mark: "Blue" | "Gold" | "Grey" | "None";
  is_private: boolean;
  profile_picture?: string;
  display_followers_count?: number; // ADD THIS LINE
  display_following_count?: number; // ADD THIS LINE
  created_at: string;
  updated_at?: string;
}

export interface CreateCharacterInput {
  universe_id: number;
  name: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  birth_date?: string;
  pro_category?: string;
  official_mark?: "Blue" | "Gold" | "Grey" | "None";
  is_private?: boolean;
  profile_picture?: string;
  banner_image?: string;
  display_followers_count?: number; // ADD THIS LINE
  display_following_count?: number; // ADD THIS LINE
}

export interface UpdateCharacterInput {
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  birth_date?: string;
  pro_category?: string;
  official_mark?: "Blue" | "Gold" | "Grey" | "None";
  is_private?: boolean;
  profile_picture?: string;
  banner_image?: string;
  display_followers_count?: number; // ADD THIS LINE
  display_following_count?: number; // ADD THIS LINE
}

// Tweak (Tweet) types
export interface Tweak {
  id: number;
  universe_id: number;
  character_id: number;
  content: string;
  images?: string[];
  comment_count: number;
  retweet_count: number;
  quote_count: number;
  like_count: number;
  view_count: number;
  source_label: string;
  custom_date?: string;
  reply_to_tweak_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateTweakInput {
  universe_id: number;
  character_id: number;
  content: string;
  images?: string[];
  comment_count?: number;
  retweet_count?: number;
  quote_count?: number;
  like_count?: number;
  view_count?: number;
  source_label?: string;
  custom_date?: string;
  reply_to_tweak_id?: number;
}

export interface UpdateTweakInput {
  content?: string;
  images?: string[]; // ADD THIS LINE
  comment_count?: number;
  retweet_count?: number;
  quote_count?: number;
  like_count?: number;
  view_count?: number;
  source_label?: string;
  custom_date?: string;
}

// Template types
export interface TweakTemplate {
  id: number;
  user_id: number;
  name: string;
  comment_count: number;
  retweet_count: number;
  quote_count: number;
  like_count: number;
  view_count: number;
  source_label: string;
  created_at: string;
}

export interface CreateTemplateInput {
  name: string;
  comment_count?: number;
  retweet_count?: number;
  quote_count?: number;
  like_count?: number;
  view_count?: number;
  source_label?: string;
}
