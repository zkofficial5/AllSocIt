import api from "./api";
import {
  TweakNowCharacter,
  CreateCharacterInput,
  UpdateCharacterInput,
  Tweak,
  CreateTweakInput,
  UpdateTweakInput,
  TweakTemplate,
  CreateTemplateInput,
} from "../types/tweaknow";

// Character APIs
export const characterAPI = {
  getAll: async (universeId: number): Promise<TweakNowCharacter[]> => {
    const response = await api.get(
      `/tweaknow/universes/${universeId}/characters`,
    );
    return response.data;
  },

  create: async (data: CreateCharacterInput): Promise<TweakNowCharacter> => {
    const response = await api.post(
      `/tweaknow/universes/${data.universe_id}/characters`,
      data,
    );
    return response.data;
  },

  update: async (
    universeId: number,
    characterId: number,
    data: UpdateCharacterInput,
  ): Promise<TweakNowCharacter> => {
    const response = await api.put(
      `/tweaknow/universes/${universeId}/characters/${characterId}`,
      data,
    );
    return response.data;
  },

  delete: async (universeId: number, characterId: number): Promise<void> => {
    await api.delete(
      `/tweaknow/universes/${universeId}/characters/${characterId}`,
    );
  },
};

// Tweak APIs
export const tweakAPI = {
  getAll: async (universeId: number): Promise<Tweak[]> => {
    const response = await api.get(`/tweaknow/universes/${universeId}/tweaks`);
    return response.data;
  },

  create: async (data: CreateTweakInput): Promise<Tweak> => {
    const response = await api.post(
      `/tweaknow/universes/${data.universe_id}/tweaks`,
      data,
    );
    return response.data;
  },

  update: async (
    universeId: number,
    tweakId: number,
    data: UpdateTweakInput,
  ): Promise<Tweak> => {
    const response = await api.put(
      `/tweaknow/universes/${universeId}/tweaks/${tweakId}`,
      data,
    );
    return response.data;
  },

  delete: async (universeId: number, tweakId: number): Promise<void> => {
    await api.delete(`/tweaknow/universes/${universeId}/tweaks/${tweakId}`);
  },

  retweet: async (
    universeId: number,
    tweakId: number,
    characterId: number,
  ): Promise<Tweak> => {
    const response = await api.post(
      `/tweaknow/universes/${universeId}/tweaks/${tweakId}/retweet`,
      { character_id: characterId },
    );
    return response.data;
  },
};

// Template APIs
export const templateAPI = {
  getAll: async (): Promise<TweakTemplate[]> => {
    const response = await api.get("/tweaknow/templates");
    return response.data;
  },

  create: async (data: CreateTemplateInput): Promise<TweakTemplate> => {
    const response = await api.post("/tweaknow/templates", data);
    return response.data;
  },

  delete: async (templateId: number): Promise<void> => {
    await api.delete(`/tweaknow/templates/${templateId}`);
  },
};

// Follow APIs
export const followAPI = {
  follow: async (
    universeId: number,
    followerId: number,
    followingId: number,
  ): Promise<void> => {
    await api.post(
      `/tweaknow/universes/${universeId}/characters/${followerId}/follow/${followingId}`,
    );
  },

  unfollow: async (
    universeId: number,
    followerId: number,
    followingId: number,
  ): Promise<void> => {
    await api.delete(
      `/tweaknow/universes/${universeId}/characters/${followerId}/unfollow/${followingId}`,
    );
  },

  checkFollowing: async (
    universeId: number,
    followerId: number,
    followingId: number,
  ): Promise<{
    is_following: boolean;
    followers_count: number;
    following_count: number;
  }> => {
    const response = await api.get(
      `/tweaknow/universes/${universeId}/characters/${followerId}/is-following/${followingId}`,
    );
    return response.data;
  },
};
