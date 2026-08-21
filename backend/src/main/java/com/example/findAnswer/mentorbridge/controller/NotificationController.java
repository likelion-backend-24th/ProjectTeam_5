package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.notification.NotificationResponse;
import com.example.findAnswer.mentorbridge.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal Long currentUserId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(notificationService.getMyNotifications(currentUserId, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(currentUserId)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long notificationId) {
        notificationService.markAsRead(currentUserId, notificationId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal Long currentUserId) {
        notificationService.markAllAsRead(currentUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/read")
    public ResponseEntity<Void> deleteReadNotifications(@AuthenticationPrincipal Long currentUserId) {
        notificationService.deleteReadNotifications(currentUserId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long notificationId) {
        notificationService.deleteNotification(currentUserId, notificationId);
        return ResponseEntity.noContent().build();
    }
}
