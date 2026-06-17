"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { VehicleForm, type VehicleFormValues } from "@/components/vehicles/VehicleForm";
import { vehiclesApi } from "@/lib/api/vehicles";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewVehiclePage() {
  const router = useRouter();

  const handleSubmit = async (values: VehicleFormValues) => {
    const { engineCc, mileageKm, ...rest } = values;
    try {
      await vehiclesApi.create({
        ...rest,
        engineCc: engineCc ? Number(engineCc) : undefined,
        mileageKm: mileageKm ? Number(mileageKm) : undefined,
      });
      toast.success("Vehicle created successfully");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to create vehicle — please try again");
    }
  };

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>
      <PageHeader title="Add Vehicle" subtitle="Enter your vehicle details to create its digital profile" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-800 rounded-4xl shadow-card border border-gray-100 dark:border-zinc-700 p-6 max-w-2xl"
      >
        <VehicleForm onSubmit={handleSubmit} submitLabel="Create Vehicle" />
      </motion.div>
    </div>
  );
}
