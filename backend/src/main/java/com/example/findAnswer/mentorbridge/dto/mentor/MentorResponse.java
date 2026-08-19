package com.example.findAnswer.mentorbridge.dto.mentor;

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
    // 기존 목록 조회용
    public MentorResponse(Long mentorId, String name, String profileImageUrl, String bio, String tags, Double rating, Integer reviewCount) {
        this(mentorId, name, profileImageUrl, bio, tags, rating, reviewCount, 0, null, null, null, null, 9900);
    }

    // 💡 구독자 수를 파라미터로 받도록 수정
    public static MentorResponse from(User user, int subscriberCount) {
        return new MentorResponse(
                user.getId(),
                user.getName(),
                user.getProfileImageUrl(),
                user.getBio(),
                user.getTags(),
                0.0,
                0,
                subscriberCount, // 👈 실제 구독자 수 대입
                user.getCompany(),
                user.getCareer(),
                user.getEducation(),
                user.getSchedule(),
                user.getSubscriptionPrice() != null ? user.getSubscriptionPrice() : 9900
        );
    }
}