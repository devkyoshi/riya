"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Wrench, FileText, Shield, Receipt, Wind,
  Camera, StickyNote, Repeat2, MapPin,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { TimelinePost } from "@/types/api";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; darkBg: string }> = {
  service:            { icon: Wrench,    color: "text-blue-600",   bg: "bg-blue-50",   darkBg: "dark:bg-blue-900/30" },
  document_upload:    { icon: FileText,  color: "text-purple-600", bg: "bg-purple-50", darkBg: "dark:bg-purple-900/30" },
  insurance_update:   { icon: Shield,    color: "text-green-600",  bg: "bg-green-50",  darkBg: "dark:bg-green-900/30" },
  revenue_license:    { icon: Receipt,   color: "text-amber-600",  bg: "bg-amber-50",  darkBg: "dark:bg-amber-900/30" },
  emission_test:      { icon: Wind,      color: "text-teal-600",   bg: "bg-teal-50",   darkBg: "dark:bg-teal-900/30" },
  photo:              { icon: Camera,    color: "text-pink-600",   bg: "bg-pink-50",   darkBg: "dark:bg-pink-900/30" },
  note:               { icon: StickyNote,color: "text-gray-600",   bg: "bg-gray-50",   darkBg: "dark:bg-zinc-700" },
  ownership_transfer: { icon: Repeat2,   color: "text-brand-600",  bg: "bg-brand-50",  darkBg: "dark:bg-brand-900/30" },
  mileage_milestone:  { icon: MapPin,    color: "text-orange-600", bg: "bg-orange-50", darkBg: "dark:bg-orange-900/30" },
};

interface TimelineFeedProps {
  posts: TimelinePost[];
}

export function TimelineFeed({ posts }: TimelineFeedProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<StickyNote size={24} className="text-gray-400" />}
        title="No activity yet"
        description="Timeline events will appear here as you add service records, documents, and more"
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100 dark:bg-zinc-800" />

      <div className="space-y-4">
        {posts.map((post, i) => {
          const cfg = typeConfig[post.postType] ?? { icon: StickyNote, color: "text-gray-600", bg: "bg-gray-50", darkBg: "dark:bg-zinc-700" };
          const Icon = cfg.icon;

          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="flex gap-4 pl-0"
            >
              <div className={`size-10 rounded-full ${cfg.bg} ${cfg.darkBg} flex items-center justify-center shrink-0 z-10`}>
                <Icon size={16} className={cfg.color} />
              </div>
              <div className="flex-1 bg-white dark:bg-zinc-800 rounded-3xl p-4 shadow-card border border-gray-100 dark:border-zinc-700 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{post.title}</p>
                  <span className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap shrink-0">{formatDate(post.createdAt)}</span>
                </div>
                {post.body && <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{post.body}</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
