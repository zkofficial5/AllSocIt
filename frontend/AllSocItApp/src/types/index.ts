// User types
export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  username: string;
  password: string;
}

// Universe types
export interface Universe {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateUniverseInput {
  name: string;
  description?: string;
}

// Navigation types

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  UniverseList: undefined;
  CreateUniverse: undefined;
  UniverseDashboard: { universeId: number; universeName: string };
  TweakNow: { universeId: number };
  CreateCharacter: { universeId: number };
  EditCharacter: { universeId: number; characterId: number };
  CreateTweak: { universeId: number; characterId?: number };
  CharacterProfile: {
    universeId: number;
    characterId: number;
    currentCharacterId?: number;
  };
  CharacterSwitcher: {
    // ADD THIS
    universeId: number;
    currentCharacterId?: number;
    onSelect: (character: any) => void;
  };

  TweetDetail: { universeId: number; tweakId: number };
  ReplyComposer: {
    universeId: number;
    replyToTweakId: number;
    replyToCharacter: any;
  };
  EditTweak: { universeId: number; tweakId: number };
};
