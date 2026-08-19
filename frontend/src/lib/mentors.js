// src/lib/mentors.js

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 토큰 가져오기 헬퍼
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("accessToken");
};

// 1. 멘토 목록 조회
export async function getMentors({ page = 0, size = 8, keyword = "" } = {}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    ...(keyword && { keyword }),
  });

  const token = getAuthToken();

  const res = await fetch(`${BACKEND_URL}/api/mentors?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    throw new Error("멘토 목록을 불러오는 데 실패했습니다.");
  }

  return res.json();
}

// 2. 멘토 단건 상세 조회
export async function getMentorById(mentorId) {
  const token = getAuthToken();

  const res = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    throw new Error("멘토 상세 정보를 불러오는 데 실패했습니다.");
  }

  return res.json();
}