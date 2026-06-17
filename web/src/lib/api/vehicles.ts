import { apiClient } from "./client";
import type { Vehicle } from "@/types/api";

export interface CreateVehicleDto {
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  fuelType: string;
  transmission: string;
  engineCc?: number;
  mileageKm?: number;
  condition: string;
  notes?: string;
}

export const vehiclesApi = {
  list: () =>
    apiClient.get<Vehicle[]>("/vehicles").then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),

  create: (data: CreateVehicleDto) =>
    apiClient.post<Vehicle>("/vehicles", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateVehicleDto>) =>
    apiClient.patch<Vehicle>(`/vehicles/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/vehicles/${id}`),

  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append("cover", file);
    return apiClient.post<{ coverPhotoUrl: string }>(`/vehicles/${id}/cover-photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  getQr: (id: string) =>
    apiClient.get(`/vehicles/${id}/qr`, { responseType: "blob" }).then((r) => r.data),
};
