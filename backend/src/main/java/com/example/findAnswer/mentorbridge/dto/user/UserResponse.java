package com.example.findAnswer.mentorbridge.dto.user;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.entity.MentorProfile;
import com.example.findAnswer.mentorbridge.entity.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String interests;
    private Role role;
    private boolean blocked;
    private LocalDateTime createdAt;
    private MentorProfileResponse mentorProfile;

    public static UserResponse from(User user) {
        UserResponse response = new UserResponse();
        response.id = user.getId();
        response.email = user.getEmail();
        response.name = user.getName();
        response.role = user.getRole();
        response.interests = user.getInterests();
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