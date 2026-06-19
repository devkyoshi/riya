import { apiClient } from "./client";

export interface BusinessAccount {
  id: string; ownerId: string;
  type: "garage" | "insurer" | "dealer";
  businessName: string; registrationNumber: string | null;
  address: string | null; contactPhone: string | null; contactEmail: string | null;
  isVerified: boolean; verificationNote: string | null;
  createdAt: string; updatedAt: string;
}

export const partnersApi = {
  register: (body: { type: "garage" | "insurer" | "dealer"; businessName: string; registrationNumber?: string; address?: string; contactPhone?: string; contactEmail?: string }) =>
    apiClient.post<BusinessAccount>("/partner/register", body).then((r) => r.data),

  getProfile: () =>
    apiClient.get<BusinessAccount>("/partner/profile").then((r) => r.data),

  updateProfile: (body: Partial<{ businessName: string; registrationNumber: string; address: string; contactPhone: string; contactEmail: string }>) =>
    apiClient.patch<BusinessAccount>("/partner/profile", body).then((r) => r.data),

  submitServiceRecord: (body: { vehiclePlate: string; serviceDate: string; mileageKm: number; description: string; parts?: any; laborCost?: string; totalCost?: string }) =>
    apiClient.post("/partner/service-records", body).then((r) => r.data),

  submitInsurance: (body: { vehiclePlate: string; policyNumber: string; coverageType?: string; startDate: string; endDate: string; premiumLkr?: string }) =>
    apiClient.post("/partner/insurance", body).then((r) => r.data),

  listSubmissions: () =>
    apiClient.get("/partner/submissions").then((r) => r.data),
};
