package com.example.findAnswer.mentorbridge.dto.oauth;

import com.example.findAnswer.mentorbridge.domain.Role;

public record AuthUser(Long id, String email, Role role) {}