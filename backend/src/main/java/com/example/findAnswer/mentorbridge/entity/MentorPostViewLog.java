package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Getter
@NoArgsConstructor
public class MentorPostViewLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Long userId;
    private Long postId;

    public MentorPostViewLog(Long userId, Long postId) {
        this.userId = userId;
        this.postId = postId;
    }
}