"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
export default function OAuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithToken } = useAuth();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const token = searchParams.get("token");
        if (!token) {
            router.replace("/login?error=no_token");
            return;
        }

        loginWithToken(token)
            .then(() => router.replace("/"))
            .catch(() => {
                localStorage.removeItem("accessToken");
                router.replace("/login?error=auth_failed");
            });
    }, [searchParams, loginWithToken, router]);

    return <p>로그인 처리 중...</p>;
}