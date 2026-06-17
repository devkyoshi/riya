"use client";

import React from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="size-16 rounded-3xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 dark:text-zinc-500 mb-5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action}
    </motion.div>
  );
}
