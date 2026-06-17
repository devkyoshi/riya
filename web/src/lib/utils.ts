import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(amount: string | number | undefined | null, currency = "LKR"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-LK", { style: "currency", currency }).format(Number(amount));
}

export function formatMileage(km: number | undefined | null): string {
  if (km == null) return "—";
  return `${km.toLocaleString()} km`;
}
