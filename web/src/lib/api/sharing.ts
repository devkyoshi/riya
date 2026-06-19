import { apiClient } from "./client";

export interface ShareLink {
  id: string;
  vehicleId: string;
  issuedBy: string;
  token: string;
  label: string | null;
  scope: Record<string, boolean>;
  isSingleUse: boolean;
  isActive: boolean;
  viewCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface CoOwner {
  vehicleId: string;
  userId: string;
  addedBy: string;
  canEdit: boolean;
  createdAt: string;
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
}

export interface ShareView {
  vehicle: {
    id: string; plateNumber: string; make: string; model: string; variant: string | null;
    year: number; color: string | null; fuelType: string; transmission: string;
    engineCapacityCC: number | null; currentMileageKm: number; condition: string;
    coverPhotoUrl: string | null; bio: string | null;
  };
  shareLink: { label: string | null; expiresAt: string | null; scope: Record<string, boolean> };
  data: {
    serviceRecords: any[];
    insurancePolicies: any[];
    revenueLicenses: any[];
    emissionTests: any[];
    documents: any[];
    mileageLog: any[];
    timeline: any[];
  };
}

export const sharingApi = {
  shareLinks: {
    create: (vehicleId: string, body: { label?: string; scope?: Record<string, boolean>; expiresInDays?: number; isSingleUse?: boolean }) =>
      apiClient.post<ShareLink>(`/vehicles/${vehicleId}/share-links`, body).then((r) => r.data),

    list: (vehicleId: string) =>
      apiClient.get<ShareLink[]>(`/vehicles/${vehicleId}/share-links`).then((r) => r.data),

    revoke: (vehicleId: string, linkId: string) =>
      apiClient.delete(`/vehicles/${vehicleId}/share-links/${linkId}`),

    getPublicView: (token: string) =>
      apiClient.get<ShareView>(`/share/${token}`).then((r) => r.data),
  },

  coOwners: {
    add: (vehicleId: string, body: { email: string; canEdit?: boolean }) =>
      apiClient.post<CoOwner>(`/vehicles/${vehicleId}/co-owners`, body).then((r) => r.data),

    list: (vehicleId: string) =>
      apiClient.get<CoOwner[]>(`/vehicles/${vehicleId}/co-owners`).then((r) => r.data),

    remove: (vehicleId: string, userId: string) =>
      apiClient.delete(`/vehicles/${vehicleId}/co-owners/${userId}`),
  },
};
