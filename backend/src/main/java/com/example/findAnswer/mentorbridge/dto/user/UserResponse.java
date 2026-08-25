package com.example.findAnswer.mentorbridge.dto.user;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.entity.MentorProfile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    private String bio;
    private String introduction;
    private String careers;
    private String location;
    private Role role;
    private String profileImageUrl;
    private boolean blocked;
    // ⚠️ 프론트(profile/page.jsx)가 user.emailVerified로 인증완료 뱃지/멘토신청 가능여부를 판단하는데
    // 이 필드가 응답에 아예 없었다 — 그래서 인증에 성공해도(verifyEmail() 호출까지 정상 실행) 화면엔
    // 항상 "미인증"으로 보였다.
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private MentorProfileResponse mentorProfile;

    // 💡 팔로우 통계 필드 추가
    // ⚠️ 프론트(users/[id]/page.jsx, profile/useProfileActions.js, questions/[id]/page.jsx)가
    // followerCount/followingCount/isFollowing로 읽는다 — Jackson 기본 직렬화 이름(followers/followings/
    // following, "is" 접두사가 getter에서 잘려나감)과 안 맞아서 항상 undefined였다. @JsonProperty로 고정.
    @JsonProperty("followerCount")
    private long followers;
    @JsonProperty("followingCount")
    private long followings;
    @JsonProperty("isFollowing")
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
        response.bio = user.getBio();
        response.introduction = user.getIntroduction();
        response.careers = user.getCareers();
        response.location = user.getLocation();
        response.profileImageUrl = user.getProfileImageUrl();
        response.blocked = user.isBlocked();
        response.emailVerified = user.isEmailVerified();
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