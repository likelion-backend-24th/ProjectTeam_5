package com.example.findAnswer.mentorbridge.dto.Inquiry;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InquiryRequestDto {
    private String category;
    private String email;
    private String title;
    private String content;
}