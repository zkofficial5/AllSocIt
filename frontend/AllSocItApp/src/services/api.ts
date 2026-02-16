import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Change this to your computer's local IP when testing on phone
// Find it by running: ipconfig getifaddr en0 (Mac) or ipconfig (Windows)
const API_BASE_URL = "http://10.168.38.253:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Auth APIs
export const authAPI = {
  signup: async (email: string, username: string, password: string) => {
    const response = await api.post("/auth/signup", {
      email,
      username,
      password,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append("username", email); // API expects 'username' field
    formData.append("password", password);

    const response = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Save token
    await AsyncStorage.setItem("access_token", response.data.access_token);
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem("access_token");
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Universe APIs
export const universeAPI = {
  getAll: async () => {
    const response = await api.get("/universes/");
    return response.data;
  },

  create: async (name: string, description?: string) => {
    const response = await api.post("/universes/", { name, description });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/universes/${id}`);
    return response.data;
  },

  update: async (id: number, name?: string, description?: string) => {
    const response = await api.put(`/universes/${id}`, { name, description });
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/universes/${id}`);
  },
};

export default api;
