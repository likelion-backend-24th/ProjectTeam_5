package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.NotificationType;
import com.example.findAnswer.mentorbridge.dto.notification.NotificationResponse;
import com.example.findAnswer.mentorbridge.entity.Notification;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // REQUIRES_NEW: 결제 실패처럼 호출부가 예외를 던져 트랜잭션이 롤백되는 경우에도
    // 알림 자체는 별도 트랜잭션으로 커밋되어 남아야 한다.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notify(Long recipientId, NotificationType type, String message, String link) {
        notificationRepository.save(
                Notification.builder()
                        .recipientId(recipientId)
                        .type(type)
                        .message(message)
                        .link(link)
                        .build()
        );
    }

    @Transactional
    public void notifyAll(List<Long> recipientIds, NotificationType type, String message, String link) {
        recipientIds.forEach(recipientId -> notify(recipientId, type, message, link));
    }

    public Page<NotificationResponse> getMyNotifications(Long currentUserId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUserId, pageable)
                .map(NotificationResponse::from);
    }

    public long getUnreadCount(Long currentUserId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(currentUserId);
    }

    @Transactional
    public void markAsRead(Long currentUserId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!notification.getRecipientId().equals(currentUserId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        notification.markAsRead();
    }

    @Transactional
    public void markAllAsRead(Long currentUserId) {
        notificationRepository.markAllAsRead(currentUserId);
    }

    @Transactional
    public void deleteReadNotifications(Long currentUserId) {
        notificationRepository.deleteByRecipientIdAndIsReadTrue(currentUserId);
    }

    @Transactional
    public void deleteNotification(Long currentUserId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));

        if (!notification.getRecipientId().equals(currentUserId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        notificationRepository.delete(notification);
    }
}
