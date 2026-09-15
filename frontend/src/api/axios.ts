import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth.store";
import type { RefreshResponse } from "../types/auth";

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const baseURL =
  import.meta.env.MODE === "production" ? "/api" : import.meta.env.VITE_API_URL;

//to api bedzie uzywane do endpointow, ktore wymagaja zalogowanego usera i access token.
export const api = axios.create({
  //url do backend
  baseURL,
  withCredentials: true,
});

// Instancja bez interceptorów do loginu, refreshu itd.
export const authApi = axios.create({
  baseURL,
  withCredentials: true,
});

//Instacja dla publicznych routow
export const publicApi = axios.create({
  baseURL,
});

//ten dziala przed otrzymaniem odp
api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const response = await authApi.post<RefreshResponse>("/auth/refresh");

        const newAccessToken = response.data.accessToken;

        useAuthStore.getState().setAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh access token:", refreshError);
        useAuthStore.getState().logout();
        //refresh nie zadziałał
        // → czyścimy store
        // → przekazujemy błąd refreshu dalej
        //to sie pokaze jak nie uda sie naprawic req
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
