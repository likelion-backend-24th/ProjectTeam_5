import { request } from "./client";
import * as authApi from "./auth";

export const getToken = () => localStorage.getItem("accessToken");

// 1. 이름 + 관심 분야 수정 (추가된 부분!)/
export function updateProfileInfo(name, interests, token) {
    return request("/api/users/me", {
        method: "PATCH",
        body: { name, interests },
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "프로필 수정에 실패했습니다.",
    });
}

// (참고: 기존 이름만 수정하는 함수 - 둬도 되고 지워도 됨)
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

// 내 멘토 신청 상태 조회
export function getMyMentorApplication(token) {
    return request("/api/users/me/mentor/application", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "멘토 신청 상태를 불러오지 못했습니다.",
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

// 8. 멘토 신청 취소
export function cancelMentorApplication(token) {
    return request("/api/users/me/mentor/application", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "멘토 신청 취소에 실패했습니다.",
    });
}

// 9. 내 프로필 / 신청 상태 조회
export function getMyProfile(token) {
    return request("/api/users/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "프로필 정보를 불러오지 못했습니다.",
    });
}

// 전체 유저 목록 조회
export async function getUsers() {
    const token = getToken();
    return request("/api/users", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "유저 목록을 불러오지 못했습니다.",
    });
}

// 특정 유저가 작성한 질문 목록 조회
export async function getQuestionsByUser(userId, page = 0) {
    const token = getToken();
    return request(`/api/questions/user/${userId}?page=${page}&size=10`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        fallbackMessage: "유저의 질문 목록을 불러오지 못했습니다.",
    });
}


// [기능 1] 정보 조회 기능 (최신 정보 불러오기 & 안내창 표시)
export const handleViewInfo = async () => {
    const token = getToken();
    if (!token) return;


    try {
        const latestUser = await authApi.getMe(token);
        alert(
            `📌 [최신 회원 정보 조회]\n` +
            // `• ID: #${latestUser.id}\n` +
            `• 이름: ${latestUser.name}\n` +
            `• 이메일: ${latestUser.email}\n` +
            `• 권한: ${latestUser.role}\n` +
            `• 관심 분야: ${latestUser.interests || interests}`
        );
    } catch (err) {
        console.log(err)
        alert("회원 정보를 조회하는 중 문제가 발생했습니다.");
    }
};

// [기능 2] 프로필 및 관심 분야 수정 저장
export const handleSaveProfile = async () => {
    const token = getToken();
    if (!token || isSubmitting) return;

    try {
        setIsSubmitting(true);

        // 이름이나 관심 분야 중 하나라도 바뀌었으면 PATCH /api/users/me 호출하여 DB 저장
        if (newName !== user.name || newInterests !== (user.interests || "")) {
            await updateProfileInfo(newName, newInterests, token);
        }

        // 이메일이 바뀌었으면 이메일 수정 API 호출
        if (newEmail !== user.email) {
            await updateProfileEmail(newEmail, token);
        }

        alert("프로필이 성공적으로 수정되었습니다. 변경 사항 적용을 위해 다시 로그인합니다.");
        setIsEditing(false);
        logout();
        router.push("/login");
    } catch (err) {
        alert(err.message || "프로필 수정에 실패했습니다.");
    } finally {
        setIsSubmitting(false);
    }
};

// [기능 3] 멘토 권한 신청
export const handleApplyMentor = async () => {
    const token = getToken();
    if (!token) return;

    if (confirm("전문가(MENTOR) 권한을 신청하시겠습니까?")) {
        try {
            await applyMentor(token);
            alert("멘토 신청이 완료되었습니다. 관리자 승인을 기다려주세요.");
            setHasAppliedMentor(true);
        } catch (err) {
            alert(err.message || "이미 신청되었거나 처리할 수 없는 상태입니다.");
        }
    }
};

// 회원 탈퇴
export const handleDeleteAccount = async () => {
    const token = getToken();
    if (!token) return;

    if (confirm("정말 탈퇴하시겠습니까? 계정 정보와 활동 내역은 복구되지 않습니다.")) {
        try {
            await deleteAccount(token);
            alert("회원 탈퇴가 완료되었습니다.");
            logout();
            router.replace("/");
        } catch (err) {
            alert(err.message || "회원 탈퇴 처리에 실패했습니다.");
        }
    }
};

// 관리자 기능 (멘토 승인)
export const handleApprove = async (targetId) => {
    const token = getToken();
    try {
        await approveMentor(targetId, token);
        alert("승인 처리되었습니다.");
        fetchAdminData();
    } catch (err) {
        alert(err.message);
    }
};

// 관리자 기능 (멘토 거절)
export const handleReject = async (targetId) => {
    const token = getToken();
    try {
        await rejectMentor(targetId, token);
        alert("거절 처리되었습니다.");
        fetchAdminData();
    } catch (err) {
        alert(err.message);
    }
};


