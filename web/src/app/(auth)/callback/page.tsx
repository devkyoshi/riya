"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "@/lib/api/client";
import { PageSpinner } from "@/components/ui/Spinner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (token && refresh) {
      setAccessToken(token);
      localStorage.setItem("refreshToken", refresh);
      router.replace("/dashboard");
    } else {
      router.replace("/login?error=oauth_failed");
    }
  }, [params, router]);

  return <PageSpinner />;
}
