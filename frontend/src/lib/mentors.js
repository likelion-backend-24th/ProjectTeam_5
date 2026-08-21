// src/lib/mentors.js
import { getAccessToken } from "./tokenStore";
import { API_URL as BACKEND_URL } from "./client";

// 토큰 가져오기 헬퍼
const getAuthToken = () => getAccessToken();

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

// 3. 멘토 리뷰 목록 조회
// ⚠️ /api/mentors/** 는 SecurityConfig에 permitAll이 없어서 anyRequest().authenticated()에 걸린다 —
// 위 getMentors/getMentorById처럼 토큰을 꼭 실어야 한다(안 그러면 401이 나는데 호출부가 조용히 삼킬 수 있음).
export async function getMentorReviews(mentorId) {
  const token = getAuthToken();

  const res = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}/reviews`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    throw new Error("리뷰 목록을 불러오는 데 실패했습니다.");
  }

  return res.json();
}

// 4. 리뷰 작성/수정 — 이미 남긴 리뷰가 있으면 덮어쓴다. 그 멘토를 구독한 적 없으면 403.
export async function submitMentorReview(mentorId, { rating, comment }) {
  const token = getAuthToken();

  const res = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ rating, comment }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || "리뷰 등록에 실패했습니다.");
  }
  return data;
}

// 5. 리뷰 삭제 — 본인 리뷰만 가능
export async function deleteMentorReview(mentorId, reviewId) {
  const token = getAuthToken();

  const res = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "리뷰 삭제에 실패했습니다.");
  }
}