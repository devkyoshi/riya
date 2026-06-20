"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OcrFieldsPanel, OcrStatusBadge } from "./OcrFieldsPanel";
import { formatDate } from "@/lib/utils";
import type { Document } from "@/types/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface DocumentCardProps {
  document: Document;
  vehicleId: string;
  onDelete?: (id: string) => void;
}

export function DocumentCard({ document, vehicleId, onDelete }: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasOcrData = document.ocrStatus === "completed" && document.extractedFields;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      <Card padding="sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-brand-500 dark:text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{document.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="neutral" size="sm">{document.documentType.replace(/_/g, " ")}</Badge>
              <OcrStatusBadge status={document.ocrStatus ?? "skipped"} />
              <span className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(document.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasOcrData && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-1.5 rounded-full text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
                title="View extracted fields"
              >
                <ChevronDown size={15} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
            <a
              href={`${BACKEND_URL}${document.fileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-full text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
            >
              <ExternalLink size={15} />
            </a>
            {onDelete && (
              <button
                onClick={() => onDelete(document.id)}
                className="p-1.5 rounded-full text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {expanded && hasOcrData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-1 border-t border-gray-100 dark:border-zinc-700 mt-3">
                <OcrFieldsPanel
                  document={document}
                  vehicleId={vehicleId}
                  onConfirmed={() => setExpanded(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
