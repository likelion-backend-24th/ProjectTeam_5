import { request } from "./client";

// 멘토 대시보드 — 전부 "나(로그인한 멘토)" 기준이라 mentorId를 안 받는다.

export function getMentorDashboardSummary() {
  return request("/api/mentors/me/dashboard/summary", {
    method: "GET",
    fallbackMessage: "대시보드 요약 정보를 불러오지 못했습니다.",
  });
}

export function getMentorDashboardTrend() {
  return request("/api/mentors/me/dashboard/trend", {
    method: "GET",
    fallbackMessage: "구독/수익 추이를 불러오지 못했습니다.",
  });
}

export function getMentorRatingHistogram() {
  return request("/api/mentors/me/dashboard/rating-histogram", {
    method: "GET",
    fallbackMessage: "리뷰 요약을 불러오지 못했습니다.",
  });
}

export function getMentorProfileCompleteness() {
  return request("/api/mentors/me/dashboard/profile-completeness", {
    method: "GET",
    fallbackMessage: "프로필 완성도를 불러오지 못했습니다.",
  });
}

export function getMentorRecentPosts() {
  return request("/api/mentors/me/dashboard/recent-posts", {
    method: "GET",
    fallbackMessage: "최근 게시글을 불러오지 못했습니다.",
  });
}

export function getMentorRecentReviews() {
  return request("/api/mentors/me/dashboard/recent-reviews", {
    method: "GET",
    fallbackMessage: "최근 리뷰를 불러오지 못했습니다.",
  });
}

export function getMentorSubscribers() {
  return request("/api/mentors/me/dashboard/subscribers", {
    method: "GET",
    fallbackMessage: "구독자 목록을 불러오지 못했습니다.",
  });
}

export function getMentorPayments() {
  return request("/api/mentors/me/dashboard/payments", {
    method: "GET",
    fallbackMessage: "결제 내역을 불러오지 못했습니다.",
  });
}

export function getMentorPendingRefunds() {
  return request("/api/mentors/me/dashboard/refunds", {
    method: "GET",
    fallbackMessage: "환불 요청 목록을 불러오지 못했습니다.",
  });
}
