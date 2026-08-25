"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/tokenStore"; // tokenStore 실제 경로로 수정

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // 1. 메모리의 AccessToken 확인
    const token = getAccessToken();
    
    // 2. localStorage의 사용자 데이터 확인
    const hasUserData =
      typeof window !== "undefined" &&
      (localStorage.getItem("userId") ||
        localStorage.getItem("id") ||
        localStorage.getItem("user"));

    // 로그인 유무 판단
    const isLoggedIn = Boolean(token || hasUserData);

    if (isLoggedIn) {
      alert("존재하지 않는 페이지입니다. 메인 페이지로 이동합니다.");
      router.replace("/");
    } else {
      alert("존재하지 않는 페이지입니다. 로그인 페이지로 이동합니다.");
      router.replace("/login");
    }
  }, [router]);

  // return null 대신 최소한의 JSX를 반환해야 Next.js 컴포넌트 에러가 발생하지 않습니다.
  return (
    <div style={{ padding: "100px 0", textAlign: "center" }}>
      <p>존재하지 않는 페이지입니다. 이동 중...</p>
    </div>
  );
}