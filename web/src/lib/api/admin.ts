import { apiClient } from "./client";
import type { Feature } from "@/types/api";

export const adminApi = {
  listFeatures: () =>
    apiClient.get<Feature[]>("/admin/features").then((r) => r.data),

  toggleFeature: (key: string, isEnabled: boolean) =>
    apiClient.patch<Feature>(`/admin/features/${key}`, { isEnabled }).then((r) => r.data),
};
