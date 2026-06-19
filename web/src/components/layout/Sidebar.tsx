"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Car, LayoutDashboard, LogOut, Sun, Moon, Shield, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles",  label: "My Vehicles", icon: Car },
  { href: "/partner",   label: "Partner Portal", icon: Building2 },
];

const adminItems = [
  { href: "/admin/features", label: "Feature Flags", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isAdmin = user?.roles?.includes("admin");

  useEffect(() => { setMounted(true); }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 flex flex-col z-30">
      {/* Brand */}
      <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center">
            <Car size={18} className="text-white dark:text-gray-900" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Riya</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-600 uppercase tracking-wider">Admin</p>
            </div>
            {adminItems.map((item) => (
              <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
            ))}
          </>
        )}
      </nav>

      {/* User + controls */}
      <div className="p-3 border-t border-gray-100 dark:border-zinc-800 space-y-1">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 mb-1">
          <div className="size-8 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 font-semibold text-sm shrink-0">
            {user?.fullName?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          {isDark ? "Light mode" : "Dark mode"}
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavLink({ href, label, icon: Icon, active }: {
  href: string; label: string; icon: React.ElementType; active: boolean;
}) {
  return (
    <Link href={href} className="block relative">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-colors",
          active
            ? "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
            : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-gray-100"
        )}
      >
        <Icon size={17} className={active ? "text-gray-900 dark:text-zinc-100" : undefined} />
        {label}
      </div>
    </Link>
  );
}
