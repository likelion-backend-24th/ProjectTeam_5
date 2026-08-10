"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthCallbackClient() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = params.get("accessToken");
    const error = params.get("error");

    if (error || !token) {
      router.replace(`/login?error=${error ?? "no_token"}`);
      return;
    }

    localStorage.setItem("accessToken", token);
    router.replace("/");
  }, [params, router]);

  return <p>로그인 처리 중...</p>;
}