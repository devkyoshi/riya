"use client";

import React, { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Camera, Car, FileText, Wrench, QrCode,
  Gauge, Fuel, Settings2, Calendar, Share2, Activity,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Spinner";
import { TimelineFeed } from "@/components/timeline/TimelineFeed";
import { ShareLinksPanel } from "@/components/sharing/ShareLinksPanel";
import { CoOwnersPanel } from "@/components/sharing/CoOwnersPanel";
import { HealthScoreCard } from "@/components/insights/HealthScoreCard";
import { ValuationCard } from "@/components/insights/ValuationCard";
import { MaintenanceSchedule } from "@/components/insights/MaintenanceSchedule";
import { MileageLogPanel } from "@/components/insights/MileageLogPanel";
import { vehiclesApi } from "@/lib/api/vehicles";
import { recordsApi } from "@/lib/api/records";
import { formatMileage } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const conditionVariant: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  excellent: "success", good: "info", fair: "warning", poor: "danger",
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const coverInput = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"timeline" | "documents" | "records" | "insights" | "sharing">("timeline");

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn:  () => vehiclesApi.get(id),
  });

  const { data: timeline } = useQuery({
    queryKey: ["timeline", id],
    queryFn:  () => recordsApi.timeline.list(id, { limit: 50 }),
    enabled:  !!id,
  });

  const coverMutation = useMutation({
    mutationFn: (file: File) => vehiclesApi.uploadCover(id, file),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["vehicle", id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => vehiclesApi.delete(id),
    onSuccess:  () => router.push("/dashboard"),
  });

  if (isLoading) return <PageSpinner />;
  if (!vehicle) return <div className="text-center py-16 text-gray-400">Vehicle not found</div>;

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors">
        <ArrowLeft size={15} /> Back
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-800 rounded-4xl shadow-card border border-gray-100 dark:border-zinc-700 overflow-hidden mb-6"
      >
        {/* Cover */}
        <div className="h-52 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-zinc-800 dark:to-zinc-950 relative group">
          {vehicle.coverPhotoUrl ? (
            <img src={`${BACKEND_URL}${vehicle.coverPhotoUrl}`} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Car size={48} className="text-brand-300" />
            </div>
          )}
          <button
            onClick={() => coverInput.current?.click()}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
          >
            <Camera size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) coverMutation.mutate(f); }}
          />
        </div>

        {/* Info */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">{vehicle.plateNumber}</p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
              {vehicle.color && <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">{vehicle.color}</p>}
            </div>
            <Badge variant={conditionVariant[vehicle.condition] ?? "neutral"}>{vehicle.condition}</Badge>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 dark:text-zinc-400">
            {vehicle.mileageKm != null && (
              <span className="flex items-center gap-1.5"><Gauge size={14} /> {formatMileage(vehicle.mileageKm)}</span>
            )}
            <span className="flex items-center gap-1.5"><Fuel size={14} /> {vehicle.fuelType}</span>
            <span className="flex items-center gap-1.5"><Settings2 size={14} /> {vehicle.transmission}</span>
            {vehicle.engineCc && <span className="flex items-center gap-1.5"><Calendar size={14} /> {vehicle.engineCc}cc</span>}
          </div>

          <div className="flex gap-2 mt-5 flex-wrap">
            <Link href={`/vehicles/${id}/documents`}>
              <Button variant="secondary" size="sm" icon={<FileText size={14} />}>Documents</Button>
            </Link>
            <Link href={`/vehicles/${id}/records`}>
              <Button variant="secondary" size="sm" icon={<Wrench size={14} />}>Records</Button>
            </Link>
            <Button variant="secondary" size="sm" icon={<QrCode size={14} />}
              onClick={async () => {
                const blob = await vehiclesApi.getQr(id);
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
              }}
            >
              QR Code
            </Button>
            <Button variant="danger" size="sm"
              loading={deleteMutation.isPending}
              onClick={() => { if (confirm("Delete this vehicle?")) deleteMutation.mutate(); }}
            >
              Delete
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-full p-1 w-fit mb-6 flex-wrap">
        {(["timeline", "documents", "records", "insights", "sharing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              tab === t
                ? "bg-white dark:bg-zinc-700 shadow-card text-gray-900 dark:text-zinc-100"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "timeline" && <TimelineFeed posts={timeline ?? []} />}
      {tab === "documents" && (
        <div className="text-center py-8">
          <Link href={`/vehicles/${id}/documents`}><Button>View Documents</Button></Link>
        </div>
      )}
      {tab === "records" && (
        <div className="text-center py-8">
          <Link href={`/vehicles/${id}/records`}><Button>View Records</Button></Link>
        </div>
      )}
      {tab === "insights" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HealthScoreCard vehicleId={id} />
            <ValuationCard vehicleId={id} />
          </div>
          <MaintenanceSchedule vehicleId={id} />
          <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 p-5">
            <MileageLogPanel vehicleId={id} />
          </div>
        </div>
      )}
      {tab === "sharing" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 p-5">
            <ShareLinksPanel vehicleId={id} />
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 p-5">
            <CoOwnersPanel vehicleId={id} />
          </div>
        </div>
      )}
    </div>
  );
}
