package com.example.findAnswer.mentorbridge.dto.user;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PublicProfileUpdateRequest {
    private String bio;           // 한 줄 소개
    private String introduction;  // 상세 소개
    private String careers;       // 경력 / 이력
    private String interests;     // 해시태그 (내 프로필의 '관심 분야'와 같은 값)
    private String location;      // 활동 지역
}
