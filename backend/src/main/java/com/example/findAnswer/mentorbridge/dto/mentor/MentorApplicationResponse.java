package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.domain.MentorApplicationStatus;
import lombok.Getter;

import java.time.LocalDateTime;

//내 멘토 신청 상태 조회 응답
@Getter
public class MentorApplicationResponse {
    private final MentorApplicationStatus status;
    private final LocalDateTime dateTime;

    public MentorApplicationResponse(MentorApplicationStatus status, LocalDateTime dateTime) {
        this.status = status;
        this.dateTime = dateTime;
    }
}
