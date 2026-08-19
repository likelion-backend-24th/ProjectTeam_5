package com.example.findAnswer.mentorbridge.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PublicProfileUpdateRequest {
    private String bio;
    private String careers;
    private String description;
    private String location;
    private String tags;
}