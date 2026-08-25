// src/app/mentors/layout.jsx
"use client";

import { useAuth } from "@/app/contexts/AuthContext"; // AuthContext 실제 경로에 맞춰 확인
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MentorsLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩이 완료되었는데 로그인 유저(user)가 없으면 로그인 페이지로 이동
    if (!loading && !user) {
      alert("로그인이 필요한 서비스입니다.");
      router.replace("/login");
    }
  }, [user, loading, router]);

  // 로그인 상태 확인 중이거나 비회원일 경우 화면 노출 차단 (깜빡임 방지)
  if (loading || !user) {
    return (
      <div style={{ padding: "100px 0", textAlign: "center" }}>
        로그인 여부를 확인하고 있습니다...
      </div>
    );
  }

  return <>{children}</>;
}