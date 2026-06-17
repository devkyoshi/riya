"use client";

import React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export function Topbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div />
      <div className="flex items-center gap-3">
        <button className="size-9 flex items-center justify-center rounded-full text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
          <Bell size={18} />
        </button>
        <div className="size-9 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 font-semibold text-sm">
          {user?.fullName?.[0]?.toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
}
