package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.WebhookEventStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "webhook_event")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class WebhookEvent extends BaseTimeEntity{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "webhook_id", nullable = false, unique = true, length = 100)
    private String webhookId;

    @Column(name = "event_type", length = 100)
    private String eventType;

    @Lob
    @Column(name = "payload")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WebhookEventStatus status;

    public void markIgnored() {
        this.status = WebhookEventStatus.IGNORED;
    }

    public void markProcessed() {
        this.status = WebhookEventStatus.PROCESSED;
    }


}
