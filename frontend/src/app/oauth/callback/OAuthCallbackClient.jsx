"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthCallbackClient() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (!token && !error) return;

    if (error || !token) {
      router.replace(`/login?error=${error ?? "no_token"}`);
      return;
    }

    localStorage.setItem("accessToken", token);
    router.replace("/");
  }, [params, router]);

  return <p>로그인 처리 중...</p>;
}

export const dynamic = "force-dynamic";