"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { insightsApi, type HealthScore } from "@/lib/api/insights";

const GRADE_COLORS: Record<string, { ring: string; text: string; bg: string }> = {
  A: { ring: "stroke-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  B: { ring: "stroke-blue-500", text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  C: { ring: "stroke-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
  D: { ring: "stroke-orange-500", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30" },
  F: { ring: "stroke-red-500", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30" },
};

function RadialScore({ score, grade }: { score: number; grade: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = GRADE_COLORS[grade] ?? GRADE_COLORS.C;

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="10" className="stroke-gray-100 dark:stroke-zinc-700" />
        <circle
          cx="50" cy="50" r={radius} fill="none" strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-700 ${colors.ring}`}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`text-2xl font-bold ${colors.text}`}>{score}</div>
        <div className={`text-xs font-semibold ${colors.text}`}>Grade {grade}</div>
      </div>
    </div>
  );
}

export function HealthScoreCard({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading, refetch } = useQuery<HealthScore>({
    queryKey: ["health-score", vehicleId],
    queryFn: () => insightsApi.healthScore(vehicleId),
    retry: false,
  });

  const FACTOR_LABELS: Record<string, string> = {
    serviceFrequency: "Service frequency",
    mileageVsAge: "Mileage vs age",
    compliance: "Document compliance",
    age: "Vehicle age",
    accidentFree: "Accident-free",
    condition: "Condition",
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-brand-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Vehicle Health Score</h3>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-4 text-center">Computing...</div>
      ) : data ? (
        <div className="flex items-center gap-6">
          <RadialScore score={data.score} grade={data.grade} />
          <div className="flex-1 space-y-1.5">
            {Object.entries(data.factors).map(([key, val]: [string, any]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">{FACTOR_LABELS[key] ?? key}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{val.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">No score computed yet</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline"
          >
            Compute now
          </button>
        </div>
      )}

      {data && (
        <p className="text-xs text-gray-400 mt-3">
          Last computed {new Date(data.calculatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
