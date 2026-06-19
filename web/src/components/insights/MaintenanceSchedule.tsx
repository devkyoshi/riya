"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Wrench, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { insightsApi, type MaintenanceItem } from "@/lib/api/insights";
import { Badge } from "@/components/ui/Badge";

const STATUS_CONFIG = {
  ok: { icon: <CheckCircle size={14} className="text-emerald-500" />, badge: "success" as const, label: "OK" },
  due_soon: { icon: <Clock size={14} className="text-amber-500" />, badge: "warning" as const, label: "Due soon" },
  overdue: { icon: <AlertTriangle size={14} className="text-red-500" />, badge: "danger" as const, label: "Overdue" },
};

export function MaintenanceSchedule({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["maintenance", vehicleId],
    queryFn: () => insightsApi.maintenanceSchedule(vehicleId),
  });

  if (isLoading) return <div className="text-sm text-gray-400 py-4 text-center">Loading...</div>;
  if (!data) return null;

  const sorted = [...data.schedule].sort((a, b) => {
    const order = { overdue: 0, due_soon: 1, ok: 2 };
    return (order[a.status] ?? 2) - (order[b.status] ?? 2);
  });

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wrench size={16} className="text-brand-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Maintenance Schedule</h3>
        <span className="ml-auto text-xs text-gray-400">{data.currentMileageKm.toLocaleString()} km</span>
      </div>

      <ul className="space-y-2">
        {sorted.map((item) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <li key={item.type} className="flex items-center gap-3 py-1.5">
              <span className="shrink-0">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.type}</p>
                <p className="text-xs text-gray-400">
                  {item.kmRemaining > 0
                    ? `${item.kmRemaining.toLocaleString()} km remaining`
                    : `${Math.abs(item.kmRemaining).toLocaleString()} km overdue`}
                  {" · "}
                  {item.daysRemaining > 0
                    ? `${item.daysRemaining}d left`
                    : `${Math.abs(item.daysRemaining)}d overdue`}
                </p>
              </div>
              <Badge variant={cfg.badge}>{cfg.label}</Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
