"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Car, Wrench, FileText, Shield, Gauge, Zap, AlertTriangle, Clock } from "lucide-react";
import { sharingApi, type ShareView } from "@/lib/api/sharing";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const conditionVariant: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  excellent: "success", good: "info", fair: "warning", poor: "danger",
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <div className="px-6 pb-4">{children}</div>
    </Card>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
}
function formatCurrency(v: string | null | undefined) {
  if (!v) return "—";
  return `LKR ${Number(v).toLocaleString()}`;
}

export default function ShareViewPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError, error } = useQuery<ShareView>({
    queryKey: ["share-view", token],
    queryFn: () => sharingApi.shareLinks.getPublicView(token),
    retry: false,
  });

  if (isLoading) return <PageSpinner />;

  if (isError) {
    const msg = (error as any)?.response?.data?.message ?? "This link may have expired or been revoked.";
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertTriangle size={40} className="text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Link unavailable</h2>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">{msg}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { vehicle, shareLink, data: records } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header banner */}
        <div className="bg-white dark:bg-zinc-800 rounded-4xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-hidden mb-6">
          {vehicle.coverPhotoUrl ? (
            <img
              src={`${BACKEND_URL}${vehicle.coverPhotoUrl}`}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="h-48 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-zinc-700 dark:to-zinc-900 flex items-center justify-center">
              <Car size={48} className="text-brand-300" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                  {vehicle.variant && <span className="text-gray-500 font-normal ml-1">{vehicle.variant}</span>}
                </h1>
                <p className="text-brand-600 dark:text-brand-400 font-mono font-semibold mt-0.5">
                  {vehicle.plateNumber}
                </p>
              </div>
              <Badge variant={conditionVariant[vehicle.condition] ?? "neutral"} className="shrink-0">
                {vehicle.condition}
              </Badge>
            </div>

            {vehicle.bio && (
              <p className="mt-3 text-gray-600 dark:text-zinc-300 text-sm">{vehicle.bio}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><Gauge size={14} />{vehicle.currentMileageKm.toLocaleString()} km</span>
              <span className="flex items-center gap-1.5"><Zap size={14} />{vehicle.fuelType}</span>
              {vehicle.engineCapacityCC && <span>{vehicle.engineCapacityCC}cc</span>}
              {vehicle.color && <span className="capitalize">{vehicle.color}</span>}
            </div>

            {shareLink.expiresAt && (
              <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                <Clock size={11} />
                Link expires {formatDate(shareLink.expiresAt)}
              </p>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-400 dark:text-zinc-500 text-center mb-6">
          This record was shared by the vehicle owner via Riya. Only sections explicitly shared are visible.
        </div>

        {/* Service Records */}
        {shareLink.scope.serviceRecords && records.serviceRecords.length > 0 && (
          <Section icon={<Wrench size={16} className="text-brand-500" />} title="Service History">
            <ul className="space-y-3">
              {records.serviceRecords.map((r: any) => (
                <li key={r.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(r.serviceDate)} · {r.mileageKm?.toLocaleString()} km{r.garageName ? ` · ${r.garageName}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.isVerified && <Badge variant="success">Verified</Badge>}
                    {r.totalCost && <span className="text-sm text-gray-500">{formatCurrency(r.totalCost)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Insurance */}
        {shareLink.scope.insurancePolicies && records.insurancePolicies.length > 0 && (
          <Section icon={<Shield size={16} className="text-brand-500" />} title="Insurance">
            <ul className="space-y-3">
              {records.insurancePolicies.map((p: any) => (
                <li key={p.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.provider}</p>
                    <p className="text-xs text-gray-400">{p.policyNumber} · {formatDate(p.startDate)} – {formatDate(p.endDate)}</p>
                  </div>
                  {p.coverageType && <Badge variant="info">{p.coverageType}</Badge>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Revenue Licenses */}
        {shareLink.scope.revenueLicenses && records.revenueLicenses.length > 0 && (
          <Section icon={<FileText size={16} className="text-brand-500" />} title="Revenue Licenses">
            <ul className="space-y-2">
              {records.revenueLicenses.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{r.licenseNumber ?? "Revenue License"}</p>
                    <p className="text-xs text-gray-400">Issued {formatDate(r.issueDate)} · Expires {formatDate(r.expiryDate)}</p>
                  </div>
                  {new Date(r.expiryDate) > new Date() ? (
                    <Badge variant="success">Valid</Badge>
                  ) : (
                    <Badge variant="danger">Expired</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Emission Tests */}
        {shareLink.scope.emissionTests && records.emissionTests.length > 0 && (
          <Section icon={<Zap size={16} className="text-brand-500" />} title="Emission Tests">
            <ul className="space-y-2">
              {records.emissionTests.map((t: any) => (
                <li key={t.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{t.testCenter ?? "Emission Test"}</p>
                    <p className="text-xs text-gray-400">Tested {formatDate(t.testDate)} · Expires {formatDate(t.expiryDate)}</p>
                  </div>
                  <Badge variant={t.result === "pass" ? "success" : "danger"}>{t.result}</Badge>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-gray-600 dark:text-zinc-300">Riya</span> · Digital Vehicle Identity Platform
        </p>
      </div>
    </div>
  );
}
