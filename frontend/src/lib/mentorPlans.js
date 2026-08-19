import { request } from "./client";

// 멘토 요금제 목록 조회 (본인 관리용으로도, 남이 볼 때도 동일 API)
export function getMentorPlans(mentorId) {
  return request(`/api/v1/mentors/${mentorId}/plans`, {
    method: "GET",
    fallbackMessage: "요금제 목록을 불러오지 못했습니다.",
  });
}

// 요금제 단건 조회
export function getMentorPlan(mentorId, planId) {
  return request(`/api/v1/mentors/${mentorId}/plans/${planId}`, {
    method: "GET",
    fallbackMessage: "요금제 정보를 불러오지 못했습니다.",
  });
}

// 요금제 등록 — 멘토 본인만 (백엔드가 mentorId와 로그인 사용자 일치 여부를 검증한다)
export function createMentorPlan(mentorId, { planName, description, price, billingCycle }) {
  return request(`/api/v1/mentors/${mentorId}/plans`, {
    method: "POST",
    body: { planName, description, price, billingCycle },
    fallbackMessage: "요금제 등록에 실패했습니다.",
  });
}

// 요금제 수정
export function updateMentorPlan(mentorId, planId, { planName, description, price, billingCycle }) {
  return request(`/api/v1/mentors/${mentorId}/plans/${planId}`, {
    method: "PUT",
    body: { planName, description, price, billingCycle },
    fallbackMessage: "요금제 수정에 실패했습니다.",
  });
}

// 요금제 삭제(백엔드는 물리 삭제가 아니라 비활성화로 처리한다)
export function deleteMentorPlan(mentorId, planId) {
  return request(`/api/v1/mentors/${mentorId}/plans/${planId}`, {
    method: "DELETE",
    fallbackMessage: "요금제 삭제에 실패했습니다.",
  });
}
