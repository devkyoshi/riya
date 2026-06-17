"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  current: number; // 1-based
  variant?: "numbered" | "dots";
}

export function StepIndicator({ steps, current, variant = "numbered" }: StepIndicatorProps) {
  if (variant === "dots") {
    return (
      <div className="flex items-center justify-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              i + 1 === current
                ? "w-6 h-2 bg-gray-900 dark:bg-white"
                : i + 1 < current
                ? "w-2 h-2 bg-gray-400 dark:bg-gray-500"
                : "w-2 h-2 bg-gray-200 dark:bg-zinc-700"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < current;
        const isActive = stepNum === current;

        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300",
                  isDone
                    ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900"
                    : isActive
                    ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900"
                    : "bg-white border-gray-200 text-gray-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500"
                )}
              >
                {isDone ? <Check size={14} strokeWidth={3} /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isActive
                    ? "text-gray-900 dark:text-zinc-100"
                    : "text-gray-400 dark:text-zinc-500"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 mb-5 transition-all duration-300",
                  i + 1 < current
                    ? "bg-gray-900 dark:bg-white"
                    : "bg-gray-200 dark:bg-zinc-700"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
