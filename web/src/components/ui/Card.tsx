import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
}

export function Card({ children, hover = false, padding = "md", className, ...props }: CardProps) {
  const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-7" };

  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-800 rounded-3xl shadow-card border border-gray-100 dark:border-zinc-700",
        hover && "transition-shadow duration-200 hover:shadow-card-hover cursor-pointer",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-gray-900 dark:text-zinc-100", className)} {...props}>
      {children}
    </h3>
  );
}
