import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

API.interceptors.request.use((config) => {
  // Support BOTH storage styles
  const direct = localStorage.getItem("token");

  let token = direct;
  if (!token) {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      try {
        token = JSON.parse(stored)?.token || null;
      } catch {
        token = null;
      }
    }
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;

