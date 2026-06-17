"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Car } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password);
      router.replace("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-950 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="mb-8">
            <div className="inline-flex size-12 rounded-2xl bg-gray-900 dark:bg-white items-center justify-center mb-5">
              <Car size={22} className="text-white dark:text-gray-900" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5">Sign in to your Riya account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              icon={<Mail size={15} />}
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              icon={<Lock size={15} />}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              error={errors.password?.message}
            />

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              Sign in
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-zinc-800" />
            </div>
            <div className="relative text-center">
              <span className="bg-white dark:bg-zinc-950 px-3 text-xs text-gray-400">or continue with</span>
            </div>
          </div>

          <a
            href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/v1/auth/google`}
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-full border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </a>

          <p className="text-center text-sm text-gray-500 dark:text-zinc-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-gray-900 dark:text-white font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Image panel — right, desktop only */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=85&auto=format&fit=crop"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="text-3xl font-bold leading-tight mb-2">
            Your vehicle's complete digital identity.
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            Service history, documents, and milestones — all in one place, always with you.
          </p>
        </div>
      </div>
    </div>
  );
}
