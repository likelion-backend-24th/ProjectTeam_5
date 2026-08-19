package com.example.findAnswer.mentorbridge.dto.question;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class QuestionLikeResponse {

    @JsonProperty("isLiked")
    private boolean isLiked;

    @JsonProperty("likeCount")
    private int likeCount;
}
