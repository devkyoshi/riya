import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizes = { sm: "size-4", md: "size-6", lg: "size-10" };

  return (
    <span
      className={cn(
        "block rounded-full border-2 border-gray-200 dark:border-zinc-700 border-t-gray-900 dark:border-t-white animate-spin",
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
