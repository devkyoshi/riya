"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { vehiclesApi } from "@/lib/api/vehicles";
import { staggerContainer, fadeUp } from "@/lib/animations";

export default function VehiclesPage() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.list,
  });

  return (
    <div>
      <PageHeader
        title="My Vehicles"
        subtitle={`${vehicles?.length ?? 0} vehicle${vehicles?.length !== 1 ? "s" : ""} registered`}
        action={
          <Link href="/vehicles/new">
            <Button icon={<Plus size={16} />}>Add Vehicle</Button>
          </Link>
        }
      />

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
