import { request } from "./client";

/**
 * 멘토 전용 게시글 조회 API
 */
export function getMentorPost(mentorId, postId) {
  return request(`/api/v1/mentors/${mentorId}/posts/${postId}`, {
    method: "GET",
    fallbackMessage: "게시글을 불러오지 못했습니다.",
  });
}