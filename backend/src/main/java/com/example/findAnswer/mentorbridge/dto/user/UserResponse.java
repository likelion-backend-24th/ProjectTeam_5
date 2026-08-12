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

    @JsonProperty("blocked")
    private boolean blocked;

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
        return response;
    }
}