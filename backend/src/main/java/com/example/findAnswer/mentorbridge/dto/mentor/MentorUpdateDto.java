package com.example.findAnswer.mentorbridge.dto.mentor;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MentorUpdateDto {
    private String bio;
    private String company;
    private String career;
    private String tags;
    private String education;
    private String schedule;
    private Integer subscriptionPrice;
}