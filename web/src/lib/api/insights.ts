import { apiClient } from "./client";

export interface MileageEntry {
  id: string; vehicleId: string; addedBy: string;
  mileageKm: number; recordedAt: string; source: string; notes: string | null; createdAt: string;
}

export interface HealthScore {
  id: string; vehicleId: string; score: number; grade: string;
  factors: Record<string, any>; calculatedAt: string;
}

export interface ValuationPrediction {
  id: string; vehicleId: string;
  estimatedValueLkr: number; minValueLkr: number; maxValueLkr: number;
  factors: Record<string, any>; calculatedAt: string;
}

export interface MaintenanceItem {
  type: string; dueAtKm: number; dueAtDate: string;
  kmRemaining: number; daysRemaining: number; status: "ok" | "due_soon" | "overdue";
}

export interface MaintenanceSchedule {
  vehicleId: string; currentMileageKm: number; schedule: MaintenanceItem[];
}

export interface FraudFlag {
  id: string; vehicleId: string; type: string; severity: string;
  details: any; isResolved: boolean; createdAt: string;
}

export const insightsApi = {
  mileage: {
    add: (vehicleId: string, body: { mileageKm: number; recordedAt: string; source?: string; notes?: string }) =>
      apiClient.post<MileageEntry>(`/vehicles/${vehicleId}/mileage`, body).then((r) => r.data),
    list: (vehicleId: string) =>
      apiClient.get<MileageEntry[]>(`/vehicles/${vehicleId}/mileage`).then((r) => r.data),
  },
  healthScore: (vehicleId: string) =>
    apiClient.get<HealthScore>(`/vehicles/${vehicleId}/health-score`).then((r) => r.data),
  valuation: (vehicleId: string) =>
    apiClient.get<ValuationPrediction>(`/vehicles/${vehicleId}/valuation`).then((r) => r.data),
  maintenanceSchedule: (vehicleId: string) =>
    apiClient.get<MaintenanceSchedule>(`/vehicles/${vehicleId}/maintenance-schedule`).then((r) => r.data),
  fraudCheck: (vehicleId: string) =>
    apiClient.post<{ flagsFound: number; flags: FraudFlag[]; entriesAnalyzed: number }>(`/vehicles/${vehicleId}/fraud-check`).then((r) => r.data),
  fraudFlags: (vehicleId: string) =>
    apiClient.get<FraudFlag[]>(`/vehicles/${vehicleId}/fraud-flags`).then((r) => r.data),
};
