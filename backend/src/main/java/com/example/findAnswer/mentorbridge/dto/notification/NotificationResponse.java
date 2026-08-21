package com.example.findAnswer.mentorbridge.dto.notification;

import com.example.findAnswer.mentorbridge.constants.NotificationType;
import com.example.findAnswer.mentorbridge.entity.Notification;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long notificationId,
        NotificationType type,
        String message,
        String link,
        boolean isRead,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getMessage(),
                notification.getLink(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
