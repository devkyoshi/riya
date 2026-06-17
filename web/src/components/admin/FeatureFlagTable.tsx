"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import type { Feature } from "@/types/api";

interface FeatureFlagTableProps {
  features: Feature[];
  onToggle: (key: string, enabled: boolean) => Promise<void>;
  togglingKey?: string;
}

export function FeatureFlagTable({ features, onToggle, togglingKey }: FeatureFlagTableProps) {
  return (
    <div className="space-y-3">
      {features.map((f, i) => (
        <motion.div
          key={f.featureKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="bg-white dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 shadow-card p-4 flex items-center gap-4"
        >
          <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${f.isEnabled ? "bg-brand-50 dark:bg-brand-900/30" : "bg-gray-100 dark:bg-zinc-700"}`}>
            {f.isEnabled
              ? <Shield size={18} className="text-brand-500" />
              : <ShieldOff size={18} className="text-gray-400" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{f.displayName}</p>
              <Badge variant={f.isEnabled ? "success" : "neutral"} size="sm">
                {f.isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            {f.description && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">{f.description}</p>}
            <p className="text-xs text-gray-300 dark:text-zinc-600 mt-0.5">Updated {formatDate(f.updatedAt)}</p>
          </div>

          <Button
            variant={f.isEnabled ? "danger" : "secondary"}
            size="sm"
            loading={togglingKey === f.featureKey}
            onClick={() => onToggle(f.featureKey, !f.isEnabled)}
          >
            {f.isEnabled ? "Disable" : "Enable"}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
