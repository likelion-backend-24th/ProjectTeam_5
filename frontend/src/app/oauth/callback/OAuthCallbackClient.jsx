"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";


export default function OAuthCallbackClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();


  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (!token && !error) return;

    if (error || !token) {
      router.replace(`/login?error=${error ?? "no_token"}`);
      return;
    }

    loginWithToken(token)
      .then(() => router.replace("/"))
      .catch(() => router.replace("/login?error=login_failed"));
  }, [params, router, loginWithToken]);

  return <p>로그인 처리 중...</p>;
}

export const dynamic = "force-dynamic";