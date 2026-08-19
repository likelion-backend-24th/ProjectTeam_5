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
        String schedule
) {
    // 기존 목록 조회용 생성자 (13개의 필드 순서에 맞게 기본값 설정)
    public MentorResponse(Long mentorId, String name, String profileImageUrl, String bio, String tags, Double rating, Integer reviewCount) {
        this(mentorId, name, profileImageUrl, bio, tags, rating, reviewCount, 0, null, null, null, null);
    }

    // User 엔티티와 구독자 수를 받아 DTO로 변환하는 메서드
    public static MentorResponse from(User user, int subscriberCount) {
        return new MentorResponse(
                user.getId(),
                user.getName(),
                user.getProfileImageUrl(),
                user.getBio(),
                user.getTags(),
                0.0,
                0,
                subscriberCount, 
                user.getCompany(),
                user.getCareer(),
                user.getEducation(),
                user.getSchedule()
                //user.getSubscriptionPrice() != null ? user.getSubscriptionPrice() : 9900
        );
    }
}