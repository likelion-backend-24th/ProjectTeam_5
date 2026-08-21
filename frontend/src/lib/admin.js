// src/lib/admin.js
import { request } from "./client";
import { getAccessToken } from "./tokenStore";

export const getToken = () => getAccessToken();

// 1. 전체 회원 목록 조회
export function getAllUsers() {
  const token = getToken();
  return request("/api/admin/users", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "회원 목록을 불러오지 못했습니다.",
  });
}

// 2. 회원 차단
export function blockUser(userId) {
  const token = getToken();
  return request(`/api/admin/users/${userId}/block`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "회원 차단 처리에 실패했습니다.",
  });
}

// 3. 회원 차단 해제
export function unblockUser(userId) {
  const token = getToken();
  return request(`/api/admin/users/${userId}/unblock`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "차단 해제 처리에 실패했습니다.",
  });
}

// 4. 회원 강제 삭제
export function deleteUserByAdmin(userId) {
  const token = getToken();
  return request(`/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "회원 삭제 처리에 실패했습니다.",
  });
}

// 5. 멘토 신청 목록 조회
export function getMentorApplications() {
  const token = getToken();
  return request("/api/admin/mentors/applications", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "멘토 신청 목록을 불러오지 못했습니다.",
  });
}

// 6. 멘토 승인
export function approveMentor(userId) {
  const token = getToken();
  return request(`/api/admin/mentors/${userId}/approval`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "멘토 승인에 실패했습니다.",
  });
}

// 7. 멘토 거절
export function rejectMentor(userId) {
  const token = getToken();
  return request(`/api/admin/mentors/${userId}/rejection`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "멘토 거절에 실패했습니다.",
  });
}

// 8. 대기 중인 환불 요청 목록 조회
export function getPendingCancellations() {
  const token = getToken();
  return request("/api/admin/cancellations", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "환불 요청 목록을 불러오지 못했습니다.",
  });
}

// 9. 환불 승인 — PortOne 취소 API가 실제로 호출된다 (되돌릴 수 없음)
export function approveCancellation(id) {
  const token = getToken();
  return request(`/api/admin/cancellations/${id}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "환불 승인 처리에 실패했습니다.",
  });
}

// 10. 환불 거절
export function rejectCancellation(id, adminNote) {
  const token = getToken();
  return request(`/api/admin/cancellations/${id}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: { adminNote },
    fallbackMessage: "환불 거절 처리에 실패했습니다.",
  });
}

// 11. 1:1 문의 목록 조회 (추가됨)
export function getInquiries() {
  const token = getToken();
  return request("/api/admin/inquiries", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    fallbackMessage: "1:1 문의 목록을 불러오지 못했습니다.",
  });
}

// 12. 1:1 문의 상태 변경 (추가됨)
export function updateInquiryStatus(id, status) {
  const token = getToken();
  return request(`/api/admin/inquiries/${id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: { status },
    fallbackMessage: "문의 상태 변경에 실패했습니다.",
  });
}