package com.example.findAnswer.mentorbridge.dto.user;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.entity.MentorProfile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String interests;
    private Role role;
    private String profileImageUrl;
    private boolean blocked;
    private LocalDateTime createdAt;
    private MentorProfileResponse mentorProfile;

    // 💡 팔로우 통계 필드 추가
    private long followers;
    private long followings;
    private boolean isFollowing;

    // 💡 UserService에서 호출하는 setFollowStats 메서드 추가
    public void setFollowStats(long followers, long followings, boolean isFollowing) {
        this.followers = followers;
        this.followings = followings;
        this.isFollowing = isFollowing;
    }

    public static UserResponse from(User user) {
        UserResponse response = new UserResponse();
        response.id = user.getId();
        response.email = user.getEmail();
        response.name = user.getName();
        response.role = user.getRole();
        response.interests = user.getInterests();
        response.profileImageUrl = user.getProfileImageUrl();
        response.blocked = user.isBlocked();
        response.createdAt = user.getCreatedAt();

        if (user.getMentorProfile() != null) {
            response.mentorProfile = MentorProfileResponse.from(user.getMentorProfile());
        }

        return response;
    }

    @Getter
    public static class MentorProfileResponse {
        private String bio;
        private String company;
        private String career;
        private String tags;
        private String education;
        private String schedule;

        public static MentorProfileResponse from(MentorProfile profile) {
            MentorProfileResponse dto = new MentorProfileResponse();
            dto.bio = profile.getBio();
            dto.company = profile.getCompany();
            dto.career = profile.getCareer();
            dto.tags = profile.getTags();
            dto.education = profile.getEducation();
            dto.schedule = profile.getSchedule();
            return dto;
        }
    }
}