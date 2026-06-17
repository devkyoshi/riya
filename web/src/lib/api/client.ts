import axios, { type AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// On 401, try refresh token rotation
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const storedRefresh = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
    if (!storedRefresh) {
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest!.headers!.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest!));
          },
          reject,
        });
      });
    }

    originalRequest!._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh`, { refreshToken: storedRefresh });
      setAccessToken(data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      processQueue(null, data.accessToken);
      originalRequest!.headers!.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest!);
    } catch (refreshError) {
      processQueue(refreshError, null);
      setAccessToken(null);
      localStorage.removeItem("refreshToken");
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
