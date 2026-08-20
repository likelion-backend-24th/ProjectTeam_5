package com.example.findAnswer.mentorbridge.dto.oauth;

import com.example.findAnswer.mentorbridge.constants.Role;

public record AuthUser(
        Long id,
        String email,
        Role role,
        boolean isBlocked,
        boolean isDeleted
) {}