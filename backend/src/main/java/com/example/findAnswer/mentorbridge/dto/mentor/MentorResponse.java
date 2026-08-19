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
//        Integer subscriptionPrice // 💡 [추가]
) {
    // 기존 목록 조회(getMentors)를 위한 생성자
    public MentorResponse(Long mentorId, String name, String profileImageUrl, String bio, String tags, Double rating, Integer reviewCount) {
        this(mentorId, name, profileImageUrl, bio, tags, rating, reviewCount, 0, null, null, null, null); //9900
    }

    // 단건 상세 조회를 위한 변환 메서드
    public static MentorResponse from(User user) {
        return new MentorResponse(
                user.getId(),
                user.getName(),
                user.getProfileImageUrl(),
                user.getBio(),
                user.getTags(),
                0.0,
                0,
                0,
                user.getCompany(),
                user.getCareer(),
                user.getEducation(),
                user.getSchedule()
//                user.getSubscriptionPrice() != null ? user.getSubscriptionPrice() : 9900 // 💡 [추가]
        );
    }
}