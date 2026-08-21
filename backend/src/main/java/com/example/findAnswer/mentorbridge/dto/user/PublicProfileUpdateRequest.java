package com.example.findAnswer.mentorbridge.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PublicProfileUpdateRequest {
    private String bio;
    private String company;
    private String career;
    private String tags;
    private String education;
    private String schedule;
    private String portfolioUrl;
}