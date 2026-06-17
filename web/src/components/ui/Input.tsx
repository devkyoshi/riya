"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, description, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 -mt-0.5">{description}</p>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400",
              "dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-500",
              "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent",
              "dark:focus:ring-white/20",
              "transition-all duration-150",
              "disabled:bg-gray-50 disabled:cursor-not-allowed dark:disabled:bg-gray-900",
              icon && "pl-10",
              error && "border-red-400 focus:ring-red-400 dark:border-red-500",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400 dark:text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
