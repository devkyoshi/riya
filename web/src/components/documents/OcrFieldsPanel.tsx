"use client";

import React from "react";
import { CheckCircle, AlertTriangle, Loader2, XCircle, SkipForward } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import type { Document, OcrField, OcrStatus } from "@/types/api";
import { documentsApi } from "@/lib/api/documents";

const FIELD_LABELS: Record<string, string> = {
  plateNumber: "Plate Number",
  ownerName: "Owner Name",
  ownerAddress: "Address",
  expiresAt: "Expiry Date",
  issueDate: "Issue Date",
  issuedate: "Issue Date",
  licenseNumber: "License Number",
  feeAmountLkr: "Fee (LKR)",
  vehicleClass: "Vehicle Class",
  chassisNumber: "Chassis No.",
  engineNumber: "Engine No.",
  make: "Make",
  model: "Model",
  year: "Year",
  color: "Color",
  fuelType: "Fuel Type",
  result: "Test Result",
  testDate: "Test Date",
  testCenter: "Test Centre",
  readings: "Readings",
  policyNumber: "Policy Number",
  insuredName: "Insured Name",
  startDate: "Start Date",
  premiumLkr: "Premium (LKR)",
  coverageType: "Coverage Type",
  provider: "Provider",
  serviceDate: "Service Date",
  mileageKm: "Mileage (km)",
  totalCost: "Total Cost",
  description: "Description",
  garageName: "Garage",
};

interface OcrStatusBadgeProps {
  status: OcrStatus;
}

export function OcrStatusBadge({ status }: OcrStatusBadgeProps) {
  const map: Record<OcrStatus, { label: string; icon: React.ReactNode; className: string }> = {
    pending: {
      label: "OCR Pending",
      icon: <Loader2 size={12} className="animate-spin" />,
      className: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
    },
    processing: {
      label: "Processing",
      icon: <Loader2 size={12} className="animate-spin" />,
      className: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    },
    completed: {
      label: "Fields Extracted",
      icon: <CheckCircle size={12} />,
      className: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    },
    failed: {
      label: "OCR Failed",
      icon: <XCircle size={12} />,
      className: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    },
    skipped: {
      label: "No OCR",
      icon: <SkipForward size={12} />,
      className: "text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800",
    },
  };

  const { label, icon, className } = map[status] ?? map.skipped;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {icon}
      {label}
    </span>
  );
}

interface OcrFieldsPanelProps {
  document: Document;
  vehicleId: string;
  onConfirmed?: () => void;
}

export function OcrFieldsPanel({ document: doc, vehicleId, onConfirmed }: OcrFieldsPanelProps) {
  const qc = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: () => documentsApi.confirmOcrFields(vehicleId, doc.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents", vehicleId] });
      toast.success("Document marked as verified");
      onConfirmed?.();
    },
    onError: () => toast.error("Failed to confirm fields"),
  });

  if (doc.ocrStatus === "skipped" || doc.ocrStatus === "pending" || doc.ocrStatus === "processing") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500 py-2">
        <OcrStatusBadge status={doc.ocrStatus} />
        {(doc.ocrStatus === "pending" || doc.ocrStatus === "processing") && (
          <span>Auto-extraction in progress…</span>
        )}
      </div>
    );
  }

  if (doc.ocrStatus === "failed") {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 py-2">
        <OcrStatusBadge status="failed" />
        <span>Could not extract fields automatically. Please enter details manually.</span>
      </div>
    );
  }

  // completed — show fields
  const fields = doc.extractedFields ?? {};
  const entries = Object.entries(fields).filter(([, f]) => f.value !== null);

  if (entries.length === 0) {
    return (
      <div className="text-sm text-gray-400 dark:text-zinc-500 py-2">
        No fields could be extracted from this document.
      </div>
    );
  }

  const lowConfidence = entries.filter(([, f]) => f.confidence < 0.70);
  const highConfidence = entries.filter(([, f]) => f.confidence >= 0.70);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
          Auto-extracted Fields
        </p>
        <OcrStatusBadge status="completed" />
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
            {entries.map(([key, field]) => (
              <FieldRow key={key} fieldKey={key} field={field} />
            ))}
          </tbody>
        </table>
      </div>

      {lowConfidence.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {lowConfidence.length} field{lowConfidence.length > 1 ? "s" : ""} extracted with low confidence.
            Please verify these before confirming.
          </p>
        </div>
      )}

      <Button
        size="sm"
        onClick={() => confirmMutation.mutate()}
        loading={confirmMutation.isPending}
        icon={<CheckCircle size={14} />}
      >
        Confirm &amp; Mark Verified
      </Button>
    </div>
  );
}

function FieldRow({ fieldKey, field }: { fieldKey: string; field: OcrField }) {
  const label = FIELD_LABELS[fieldKey] ?? fieldKey.replace(/([A-Z])/g, " $1").trim();
  const isLowConf = field.confidence < 0.70;
  const confPct = Math.round(field.confidence * 100);

  return (
    <tr className={isLowConf ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}>
      <td className="px-4 py-2.5 text-gray-500 dark:text-zinc-400 w-40 font-medium">{label}</td>
      <td className="px-4 py-2.5 text-gray-900 dark:text-zinc-100 font-mono text-xs">{field.value}</td>
      <td className="px-4 py-2.5 w-24 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isLowConf && <AlertTriangle size={11} className="text-amber-500 dark:text-amber-400" />}
          <span className={`text-xs font-medium ${
            isLowConf
              ? "text-amber-600 dark:text-amber-400"
              : "text-green-600 dark:text-green-400"
          }`}>
            {confPct}%
          </span>
        </div>
      </td>
    </tr>
  );
}
