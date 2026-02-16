import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  // Token management
  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem("access_token");
  },

  setToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem("access_token", token);
  },

  removeToken: async (): Promise<void> => {
    await AsyncStorage.removeItem("access_token");
  },

  // User data
  setUser: async (user: any): Promise<void> => {
    await AsyncStorage.setItem("user", JSON.stringify(user));
  },

  getUser: async (): Promise<any | null> => {
    const user = await AsyncStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  removeUser: async (): Promise<void> => {
    await AsyncStorage.removeItem("user");
  },

  // Clear all
  clearAll: async (): Promise<void> => {
    await AsyncStorage.clear();
  },
};
