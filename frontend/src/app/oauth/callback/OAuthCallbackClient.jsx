"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";


export default function OAuthCallbackClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { restoreSession } = useAuth();


  useEffect(() => {
    const error = params.get("error");

    if (error) {
      router.replace(`/login?error=${error}`);
      return;
    }

    // accessToken은 URL로 넘어오지 않는다 — 백엔드가 이 페이지로 리다이렉트하기 전에 이미 심어둔
    // refreshToken(HttpOnly 쿠키)으로 여기서 바로 재발급받는다(브라우저 히스토리/서버 로그에 토큰이 안 남는다).
    restoreSession()
      .then((me) => (me ? router.replace("/") : router.replace("/login?error=login_failed")))
      .catch(() => router.replace("/login?error=login_failed"));
  }, [params, router, restoreSession]);

  return <p>로그인 처리 중...</p>;
}

export const dynamic = "force-dynamic";