import { request } from "./client";

// 1. 프로필 이름 수정
export function updateProfileName(name, token) {
    return request("/api/users/me", {
        method: "PATCH",
        body: { name },
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "이름 수정에 실패했습니다.",
    });
}

// 2. 이메일 수정
export function updateProfileEmail(email, token) {
    return request("/api/users/me/email", {
        method: "PATCH",
        body: { email },
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "이메일 수정에 실패했습니다.",
    });
}

// 3. 회원 탈퇴
export function deleteAccount(token) {
    return request("/api/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "회원 탈퇴 처리에 실패했습니다.",
    });
}

// 4. 멘토 신청
export function applyMentor(token) {
    return request("/api/users/me/mentor/application", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "멘토 신청에 실패했습니다.",
    });
}

// 5. [관리자용] 멘토 신청 목록 조회
export function getMentorApplications(token) {
    return request("/api/admin/mentors/applications", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "멘토 신청 목록을 불러오지 못했습니다.",
    });
}

// 6. [관리자용] 멘토 승인
export function approveMentor(userId, token) {
    return request(`/api/admin/mentors/${userId}/approval`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "멘토 승인에 실패했습니다.",
    });
}

// 7. [관리자용] 멘토 거절
export function rejectMentor(userId, token) {
    return request(`/api/admin/mentors/${userId}/rejection`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "멘토 거절에 실패했습니다.",
    });
}