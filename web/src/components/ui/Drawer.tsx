"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, width = "max-w-md" }: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={cn(
              "relative ml-auto h-full bg-surface shadow-modal overflow-y-auto",
              "rounded-l-4xl",
              "w-full",
              width
            )}
          >
            <div className="sticky top-0 bg-surface z-10 flex items-center justify-between p-5 border-b border-gray-100">
              {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-surface-subtle transition-colors ml-auto"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
