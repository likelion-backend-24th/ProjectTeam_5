package com.example.findAnswer.mentorbridge.dto.questionAttachedFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SignRequest(
        @NotBlank(message = "파일명은 필수입니다.")
        String filename,

        @NotNull(message = "파일크기는 필수입니다.")
        @Positive(message = "파일이 너무 작습니다.")
        Long fileSize
) {
}
