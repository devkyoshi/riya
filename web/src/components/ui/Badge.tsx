import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm", className, ...props }: BadgeProps) {
  const variants = {
    default: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    danger:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    info:    "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    neutral: "bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-0.5",
    md: "text-sm px-3 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
