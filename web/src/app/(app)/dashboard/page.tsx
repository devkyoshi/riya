"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Car, FileText, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/lib/auth/AuthContext";
import { vehiclesApi } from "@/lib/api/vehicles";
import { staggerContainer, fadeUp } from "@/lib/animations";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn:  vehiclesApi.list,
  });

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div>
      <PageHeader
        title={`Good day, ${firstName}`}
        subtitle="Manage your vehicles and documents"
        action={
          <Link href="/vehicles/new">
            <Button icon={<Plus size={16} />}>Add Vehicle</Button>
          </Link>
        }
      />

      {/* Stats row */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-4 mb-8"
      >
        {[
          { label: "Vehicles", value: vehicles?.length ?? 0, icon: Car, color: "text-brand-500 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400" },
          { label: "Documents", value: "—", icon: FileText, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400" },
          { label: "Service Records", value: "—", icon: Wrench, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="bg-white dark:bg-zinc-800 rounded-3xl shadow-card border border-gray-100 dark:border-zinc-700 p-5 flex items-center gap-4"
          >
            <div className={`size-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Vehicles grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">My Vehicles</h2>
        {(vehicles?.length ?? 0) > 0 && (
          <Link href="/vehicles" className="text-sm text-brand-500 hover:text-brand-600 font-medium">View all</Link>
        )}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : vehicles && vehicles.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {vehicles.map((v) => (
            <motion.div key={v.id} variants={fadeUp}>
              <VehicleCard vehicle={v} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={<Car size={28} className="text-brand-400" />}
          title="No vehicles yet"
          description="Add your first vehicle to start building its digital history"
          action={
            <Link href="/vehicles/new">
              <Button icon={<Plus size={16} />}>Add Your First Vehicle</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
