import { apiClient } from "./client";
import type { ServiceRecord, InsurancePolicy, RevenueLicense, EmissionTest, TimelinePost } from "@/types/api";

export const recordsApi = {
  service: {
    list: (vehicleId: string) =>
      apiClient.get<ServiceRecord[]>(`/vehicles/${vehicleId}/service-records`).then((r) => r.data),
    create: (vehicleId: string, data: Omit<ServiceRecord, "id" | "vehicleId" | "createdAt">) =>
      apiClient.post<ServiceRecord>(`/vehicles/${vehicleId}/service-records`, data).then((r) => r.data),
  },

  insurance: {
    list: (vehicleId: string) =>
      apiClient.get<InsurancePolicy[]>(`/vehicles/${vehicleId}/insurance`).then((r) => r.data),
    create: (vehicleId: string, data: Omit<InsurancePolicy, "id" | "vehicleId" | "createdAt">) =>
      apiClient.post<InsurancePolicy>(`/vehicles/${vehicleId}/insurance`, data).then((r) => r.data),
  },

  revenue: {
    list: (vehicleId: string) =>
      apiClient.get<RevenueLicense[]>(`/vehicles/${vehicleId}/revenue-licenses`).then((r) => r.data),
    create: (vehicleId: string, data: Omit<RevenueLicense, "id" | "vehicleId" | "createdAt">) =>
      apiClient.post<RevenueLicense>(`/vehicles/${vehicleId}/revenue-licenses`, data).then((r) => r.data),
  },

  emission: {
    list: (vehicleId: string) =>
      apiClient.get<EmissionTest[]>(`/vehicles/${vehicleId}/emission-tests`).then((r) => r.data),
    create: (vehicleId: string, data: Omit<EmissionTest, "id" | "vehicleId" | "createdAt">) =>
      apiClient.post<EmissionTest>(`/vehicles/${vehicleId}/emission-tests`, data).then((r) => r.data),
  },

  timeline: {
    list: (vehicleId: string, params?: { limit?: number; offset?: number; type?: string }) =>
      apiClient
        .get<{ data: TimelinePost[]; limit: number; offset: number; hasMore: boolean }>(
          `/vehicles/${vehicleId}/timeline`,
          { params }
        )
        .then((r) => r.data.data),
  },
};
