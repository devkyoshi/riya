import { apiClient } from "./client";
import type { Document } from "@/types/api";

export const documentsApi = {
  list: (vehicleId: string) =>
    apiClient.get<Document[]>(`/vehicles/${vehicleId}/documents`).then((r) => r.data),

  get: (vehicleId: string, docId: string) =>
    apiClient.get<Document>(`/vehicles/${vehicleId}/documents/${docId}`).then((r) => r.data),

  upload: (vehicleId: string, file: File, meta: { documentType: string; title: string; notes?: string }) => {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", meta.documentType);
    form.append("title", meta.title);
    if (meta.notes) form.append("notes", meta.notes);
    return apiClient.post<Document>(`/vehicles/${vehicleId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  delete: (vehicleId: string, docId: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/documents/${docId}`),

  confirmOcrFields: (vehicleId: string, docId: string) =>
    apiClient.patch<Document>(`/vehicles/${vehicleId}/documents/${docId}/confirm-ocr`).then((r) => r.data),
};
