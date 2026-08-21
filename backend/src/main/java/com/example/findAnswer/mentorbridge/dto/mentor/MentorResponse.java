package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.entity.MentorProfile;
import com.example.findAnswer.mentorbridge.entity.User;

public record MentorResponse(
        Long mentorId,
        String name,
        String profileImageUrl,
        String bio,
        String tags,
        Double rating,
        Integer reviewCount,
        Integer subscriberCount,
        String company,
        String career,
        String education,
        String schedule,
        Integer subscriptionPrice
) {
    // 기존 목록 조회용 생성자 (총 13개의 필드 순서와 개수에 맞게 기본값 설정)
    public MentorResponse(Long mentorId, String name, String profileImageUrl, String bio, String tags, Double rating, Integer reviewCount) {
        this(mentorId, name, profileImageUrl, bio, tags, rating, reviewCount, 0, null, null, null, null, 9900);
    }

    // User 엔티티와 구독자 수만 받는 예전 버전 — 평점/리뷰 수는 0으로 둔다(호출부에서 점진 이관 중).
    public static MentorResponse from(User user, int subscriberCount) {
        return from(user, subscriberCount, 0.0, 0);
    }

    // User 엔티티 + 구독자 수 + 실제 집계된 평점/리뷰 수로 DTO 변환
    public static MentorResponse from(User user, int subscriberCount, double rating, int reviewCount) {
        MentorProfile profile = user.getMentorProfile();

        return new MentorResponse(
                user.getId(),
                user.getName(),
                user.getProfileImageUrl(),
                profile != null ? profile.getBio() : null,
                profile != null ? profile.getTags() : null,
                rating,
                reviewCount,
                subscriberCount,
                profile != null ? profile.getCompany() : null,
                profile != null ? profile.getCareer() : null,
                profile != null ? profile.getEducation() : null,
                profile != null ? profile.getSchedule() : null,
                9900
        );
    }
}