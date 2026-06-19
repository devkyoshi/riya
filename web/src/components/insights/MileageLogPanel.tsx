"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gauge, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { insightsApi } from "@/lib/api/insights";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

export function MileageLogPanel({ vehicleId }: { vehicleId: string }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [mileageKm, setMileageKm] = useState("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["mileage-log", vehicleId],
    queryFn: () => insightsApi.mileage.list(vehicleId),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      insightsApi.mileage.add(vehicleId, {
        mileageKm: Number(mileageKm),
        recordedAt,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mileage-log", vehicleId] });
      qc.invalidateQueries({ queryKey: ["health-score", vehicleId] });
      setShowAdd(false);
      setMileageKm("");
      setNotes("");
      toast.success("Mileage logged");
    },
    onError: () => toast.error("Failed to log mileage"),
  });

  const fraudMutation = useMutation({
    mutationFn: () => insightsApi.fraudCheck(vehicleId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["fraud-flags", vehicleId] });
      if (res.flagsFound > 0) {
        toast.warning(`${res.flagsFound} anomaly flag${res.flagsFound > 1 ? "s" : ""} detected`);
      } else {
        toast.success("No odometer anomalies detected");
      }
    },
    onError: () => toast.error("Fraud check failed"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Gauge size={16} className="text-brand-500" />
          Mileage Log
        </h3>
        <div className="flex items-center gap-2">
          {entries.length >= 2 && (
            <Button
              size="sm"
              variant="secondary"
              icon={<AlertTriangle size={13} />}
              loading={fraudMutation.isPending}
              onClick={() => fraudMutation.mutate()}
            >
              Check
            </Button>
          )}
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
            Log
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-4">Loading...</div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Gauge size={24} />}
          title="No mileage entries"
          description="Log mileage readings to enable fraud detection and better health scoring."
        />
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-zinc-700/50 last:border-0">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {e.mileageKm.toLocaleString()} km
                </span>
                {e.notes && <span className="text-xs text-gray-400 ml-2">{e.notes}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{e.source}</Badge>
                <span className="text-xs text-gray-400">
                  {new Date(e.recordedAt).toLocaleDateString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Mileage" size="sm">
        <div className="space-y-4">
          <Input
            label="Mileage (km)"
            type="number"
            min="0"
            placeholder="e.g. 52000"
            value={mileageKm}
            onChange={(e) => setMileageKm(e.target.value)}
          />
          <Input
            label="Date"
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. After road trip"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={addMutation.isPending} onClick={() => addMutation.mutate()} disabled={!mileageKm}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
