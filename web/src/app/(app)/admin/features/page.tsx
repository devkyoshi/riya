"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { FeatureFlagTable } from "@/components/admin/FeatureFlagTable";
import { adminApi } from "@/lib/api/admin";

export default function AdminFeaturesPage() {
  const qc = useQueryClient();
  const [togglingKey, setTogglingKey] = useState<string | undefined>();

  const { data: features, isLoading } = useQuery({
    queryKey: ["admin", "features"],
    queryFn:  adminApi.listFeatures,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adminApi.toggleFeature(key, enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "features"] });
      setTogglingKey(undefined);
    },
  });

  const handleToggle = async (key: string, enabled: boolean) => {
    setTogglingKey(key);
    await toggleMutation.mutateAsync({ key, enabled });
  };

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        subtitle="Enable or disable platform features for all users"
      />

      {isLoading ? (
        <PageSpinner />
      ) : features ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <FeatureFlagTable
            features={features}
            onToggle={handleToggle}
            togglingKey={togglingKey}
          />
        </motion.div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Shield size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No features configured</p>
        </div>
      )}
    </div>
  );
}
