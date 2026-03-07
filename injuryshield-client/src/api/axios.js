import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

API.interceptors.request.use(
  (config) => {
    const directToken = localStorage.getItem("token");

    let token = directToken;

    if (!token) {
      const storedUserInfo = localStorage.getItem("userInfo");

      if (storedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(storedUserInfo);
          token = parsedUserInfo?.token || null;
        } catch (error) {
          token = null;
        }
      }
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;

