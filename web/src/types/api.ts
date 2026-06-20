export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Vehicle {
  id: string;
  ownerId: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  fuelType: "petrol" | "diesel" | "electric" | "hybrid" | "cng";
  transmission: "manual" | "automatic" | "cvt";
  engineCc?: number;
  mileageKm?: number;
  condition: "excellent" | "good" | "fair" | "poor";
  coverPhotoUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export type OcrStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

export interface OcrField {
  value: string | null;
  confidence: number;
}

export interface Document {
  id: string;
  vehicleId: string;
  documentType: string;
  title: string;
  fileUrl: string;
  fileMimeType: string;
  fileSizeBytes: number;
  ocrStatus: OcrStatus;
  extractedFields: Record<string, OcrField> | null;
  notes?: string;
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceDate: string;
  mileageKm?: number;
  description: string;
  garageName?: string;
  totalCost?: string;
  currency?: string;
  createdAt: string;
}

export interface InsurancePolicy {
  id: string;
  vehicleId: string;
  provider: string;
  policyNumber: string;
  startDate: string;
  endDate: string;
  coverageType: string;
  premiumLkr?: string;
  createdAt: string;
}

export interface RevenueLicense {
  id: string;
  vehicleId: string;
  issueDate: string;
  expiryDate: string;
  feeAmountLkr?: string;
  createdAt: string;
}

export interface EmissionTest {
  id: string;
  vehicleId: string;
  testDate: string;
  expiryDate?: string;
  testCenter?: string;
  result: "pass" | "fail" | "conditional";
  notes?: string;
  createdAt: string;
}

export interface TimelinePost {
  id: string;
  vehicleId: string;
  postType: string;
  title: string;
  body?: string;
  payload: Record<string, unknown>;
  visibility: "private" | "shared" | "public";
  createdAt: string;
}

export interface Feature {
  featureKey: string;
  displayName: string;
  description?: string;
  isEnabled: boolean;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  error: string;
  message: string;
}
