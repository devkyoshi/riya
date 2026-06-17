"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-150 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 " +
    "dark:focus-visible:ring-white dark:focus-visible:ring-offset-gray-900 " +
    "disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-700 shadow-sm " +
      "dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:active:bg-gray-200",
    secondary:
      "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 " +
      "dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:active:bg-gray-600",
    ghost:
      "text-gray-600 hover:bg-gray-100 active:bg-gray-200 " +
      "dark:text-zinc-400 dark:hover:bg-zinc-800 dark:active:bg-gray-700",
    danger:
      "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm " +
      "dark:bg-red-600 dark:hover:bg-red-700",
  };

  const sizes = {
    sm: "text-sm px-4 py-1.5",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-7 py-3.5",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {loading ? (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}
