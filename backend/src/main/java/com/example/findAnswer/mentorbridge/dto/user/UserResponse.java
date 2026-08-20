package com.example.findAnswer.mentorbridge.dto.user;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.entity.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String interests;
    private Role role;
    private String profileImageUrl;
    private String bio;
    private String careers;
    private String description;
    private String location;
    private String tags;
    private long followerCount;
    private long followingCount;

    @JsonProperty("blocked")
    private boolean blocked;

    @JsonProperty("isFollowing")
    private boolean isFollowing;

    @JsonProperty("emailVerified")
    private boolean emailVerified;

    private LocalDateTime createdAt;

    public UserResponse() {}

    public static UserResponse from(User user) {
        UserResponse response = new UserResponse();
        response.id = user.getId();
        response.email = user.getEmail();
        response.name = user.getName();
        response.role = user.getRole();
        response.interests = user.getInterests();
        response.blocked = user.isBlocked();
        response.createdAt = user.getCreatedAt();
        response.profileImageUrl = user.getProfileImageUrl();
        response.bio = user.getBio();
        response.careers = user.getCareers();
        response.description = user.getDescription();
        response.location = user.getLocation();
        response.tags = user.getTags();
        response.emailVerified = user.isEmailVerified();
        return response;
    }

    public void setFollowStats(long followerCount, long followingCount, boolean isFollowing) {
        this.followerCount = followerCount;
        this.followingCount = followingCount;
        this.isFollowing = isFollowing;
    }
}