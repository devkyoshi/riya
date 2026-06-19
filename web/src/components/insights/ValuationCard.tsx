"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { insightsApi, type ValuationPrediction } from "@/lib/api/insights";

function formatLKR(v: number) {
  if (v >= 1_000_000) return `LKR ${(v / 1_000_000).toFixed(1)}M`;
  return `LKR ${(v / 1000).toFixed(0)}K`;
}

export function ValuationCard({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading, refetch } = useQuery<ValuationPrediction>({
    queryKey: ["valuation", vehicleId],
    queryFn: () => insightsApi.valuation(vehicleId),
    retry: false,
  });

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-brand-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Resale Valuation</h3>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-4 text-center">Computing...</div>
      ) : data ? (
        <div>
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {formatLKR(data.estimatedValueLkr)}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">
              Range: {formatLKR(data.minValueLkr)} – {formatLKR(data.maxValueLkr)}
            </p>
          </div>
          <div className="space-y-1.5">
            {[
              ["Make", data.factors.make],
              ["Year", data.factors.year],
              ["Condition", data.factors.condition],
              ["Mileage", `${data.factors.mileageKm?.toLocaleString()} km`],
              ["Mileage adj.", `${data.factors.mileageAdjustmentPct > 0 ? "+" : ""}${data.factors.mileageAdjustmentPct}%`],
            ].map(([k, v]) => (
              <div key={k as string} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">{k}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{v as string}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Estimate · Last updated {new Date(data.calculatedAt).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">No valuation computed yet</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline"
          >
            Compute now
          </button>
        </div>
      )}
    </div>
  );
}
