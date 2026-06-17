"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Lock, Car } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";

const schema = z.object({
  fullName: z.string().min(2, "At least 2 characters"),
  email:    z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await authRegister(data.fullName, data.email, data.password);
      router.replace("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Registration failed";
      toast.error(msg);
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5">Start your vehicle journey with Riya</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              icon={<User size={15} />}
              placeholder="Kasun Perera"
              autoComplete="name"
              description="Your name as it appears on documents"
              {...register("fullName")}
              error={errors.fullName?.message}
            />
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
              autoComplete="new-password"
              description="Minimum 8 characters"
              {...register("password")}
              error={errors.password?.message}
            />

            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-zinc-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 dark:text-white font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Image panel — right, desktop only */}
      <div className="hidden lg:block lg:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1600&q=85&auto=format&fit=crop"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="text-3xl font-bold leading-tight mb-2">
            One place for everything your vehicle needs.
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            Build a verified, tamper-evident history that buyers and insurers can trust.
          </p>
        </div>
      </div>
    </div>
  );
}
