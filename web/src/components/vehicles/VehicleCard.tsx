"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Car, Gauge, Fuel } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Vehicle } from "@/types/api";
import { formatMileage } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const conditionVariant: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  excellent: "success",
  good:      "info",
  fair:      "warning",
  poor:      "danger",
};

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/vehicles/${vehicle.id}`}>
        <Card hover padding="none" className="overflow-hidden">
          {/* Cover photo */}
          <div className="h-40 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-zinc-800 dark:to-zinc-900 relative">
            {vehicle.coverPhotoUrl ? (
              <img
                src={`${BACKEND_URL}${vehicle.coverPhotoUrl}`}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Car size={40} className="text-brand-300" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge variant={conditionVariant[vehicle.condition] ?? "neutral"} size="sm">
                {vehicle.condition}
              </Badge>
            </div>
          </div>

          {/* Details */}
          <div className="p-4">
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-0.5">
              {vehicle.plateNumber}
            </p>
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-zinc-500">
              {vehicle.mileageKm != null && (
                <span className="flex items-center gap-1">
                  <Gauge size={12} /> {formatMileage(vehicle.mileageKm)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Fuel size={12} /> {vehicle.fuelType}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
