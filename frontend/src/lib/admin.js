// src/lib/admin.js
import { request } from "./client";
// 토큰은 request 헬퍼가 tokenStore에서 직접 읽어 붙인다.
// 여기서 명시적으로 Authorization 헤더를 넘기면 401 → refresh → 재시도 때 옛 토큰이 그대로 재사용돼
// 갱신이 안 된다(lib/auth.js의 주석 참고). 관리자 화면이 토큰 만료 후 영구히 실패하던 원인.
export { getAccessToken as getToken } from "./tokenStore";

// 1. 전체 회원 목록 조회 (페이지네이션 없음 — 질문 관리 탭의 작성자 집계 전용)
export function getAllUsers() {
  return request("/api/admin/users", {
    method: "GET",
    fallbackMessage: "회원 목록을 불러오지 못했습니다.",
  });
}

// 1-1. 회원 관리 탭 전용 — 검색/역할 필터/정렬 + 서버 페이지네이션
export function searchUsers({ page = 0, size = 20, keyword = "", role, sort = "latest" } = {}) {
  const token = getToken();
  const params = new URLSearchParams({ page, size, sort });
  if (keyword) params.set("keyword", keyword);
  if (role && role !== "ALL") params.set("role", role);

  return request(`/api/admin/users/search?${params.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "회원 목록을 불러오지 못했습니다.",
  });
}

// 2. 회원 차단
export function blockUser(userId) {
  return request(`/api/admin/users/${userId}/block`, {
    method: "PATCH",
    fallbackMessage: "회원 차단 처리에 실패했습니다.",
  });
}

// 3. 회원 차단 해제
export function unblockUser(userId) {
  return request(`/api/admin/users/${userId}/unblock`, {
    method: "PATCH",
    fallbackMessage: "차단 해제 처리에 실패했습니다.",
  });
}

// 4. 회원 강제 삭제
export function deleteUserByAdmin(userId) {
  return request(`/api/admin/users/${userId}`, {
    method: "DELETE",
    fallbackMessage: "회원 삭제 처리에 실패했습니다.",
  });
}

// 5. 멘토 신청 목록 조회
export function getMentorApplications() {
  return request("/api/admin/mentors/applications", {
    method: "GET",
    fallbackMessage: "멘토 신청 목록을 불러오지 못했습니다.",
  });
}

// 6. 멘토 승인
export function approveMentor(userId) {
  return request(`/api/admin/mentors/${userId}/approval`, {
    method: "PATCH",
    fallbackMessage: "멘토 승인에 실패했습니다.",
  });
}

// 7. 멘토 거절
export function rejectMentor(userId) {
  return request(`/api/admin/mentors/${userId}/rejection`, {
    method: "PATCH",
    fallbackMessage: "멘토 거절에 실패했습니다.",
  });
}

// 8. 대기 중인 환불 요청 목록 조회
export function getPendingCancellations() {
  return request("/api/admin/cancellations", {
    method: "GET",
    fallbackMessage: "환불 요청 목록을 불러오지 못했습니다.",
  });
}

// 9. 환불 승인 — PortOne 취소 API가 실제로 호출된다 (되돌릴 수 없음)
export function approveCancellation(id) {
  return request(`/api/admin/cancellations/${id}/approve`, {
    method: "PATCH",
    fallbackMessage: "환불 승인 처리에 실패했습니다.",
  });
}

// 10. 환불 거절
export function rejectCancellation(id, adminNote) {
  return request(`/api/admin/cancellations/${id}/reject`, {
    method: "PATCH",
    body: { adminNote },
    fallbackMessage: "환불 거절 처리에 실패했습니다.",
  });
}

// 11. 1:1 문의 목록 조회 (추가됨)
export function getInquiries() {
  return request("/api/admin/inquiries", {
    method: "GET",
    fallbackMessage: "1:1 문의 목록을 불러오지 못했습니다.",
  });
}

// 12. 1:1 문의 상태 변경 (추가됨)
export function updateInquiryStatus(id, status) {
  return request(`/api/admin/inquiries/${id}/status`, {
    method: "PATCH",
    body: { status },
    fallbackMessage: "문의 상태 변경에 실패했습니다.",
  });
}

// 전체 정산 내역 조회 (추가됨)
export function getAllSettlements() {
  return request("/api/admin/settlements", {
    method: "GET",
    fallbackMessage: "정산 내역을 불러오지 못했습니다.",
  });
}

// 정산 완료 처리 (추가됨)
export function completeSettlement(id) {
  return request(`/api/admin/settlements/${id}/complete`, {
    method: "PATCH",
    fallbackMessage: "정산 완료 처리에 실패했습니다.",
  });
}