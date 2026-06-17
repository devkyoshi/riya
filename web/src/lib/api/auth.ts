import { apiClient } from "./client";
import type { AuthResponse } from "@/types/api";

export const authApi = {
  register: (data: { fullName: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post("/auth/logout", { refreshToken }),

  googleRedirectUrl: () =>
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/v1/auth/google`,
};
