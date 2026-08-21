package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.NotificationType;
import com.example.findAnswer.mentorbridge.dto.chat.ChatMessageResponse;
import com.example.findAnswer.mentorbridge.dto.chat.ChatRoomResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionCheckResponse;
import com.example.findAnswer.mentorbridge.entity.ChatMessage;
import com.example.findAnswer.mentorbridge.entity.ChatRoom;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.ChatMessageRepository;
import com.example.findAnswer.mentorbridge.repository.ChatRoomRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final NotificationService notificationService;


    @Transactional
    public ChatRoomResponse getOrCreateRoom(Long currentUserId, Long mentorId) {
        if (currentUserId.equals(mentorId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        SubscriptionCheckResponse check = subscriptionService.checkAccessPermission(currentUserId, mentorId);
        if (!check.accessAllowed()) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        // 이미 방이 있으면(과거에 구독했던 이력 포함) 새로 안 만들고 그대로 재사용 -> 메시지 이력이 안 끊긴다.
        ChatRoom room = chatRoomRepository.findByMentorIdAndSubscriberId(mentorId, currentUserId)
                .orElseGet(() -> chatRoomRepository.save(
                        ChatRoom.builder()
                                .mentorId(mentorId)
                                .subscriberId(currentUserId)
                                .build()
                ));

        // 종료됐던 방이면 다시 상담 신청이 들어온 거니 양쪽 모두에게 다시 보이도록 되살린다.
        if (room.isEnded()) {
            room.reactivate();
        }

        return toRoomResponse(room, currentUserId);
    }

    public List<ChatRoomResponse> getMyRooms(Long currentUserId) {
        return chatRoomRepository.findByMentorIdOrSubscriberId(currentUserId, currentUserId)
                .stream()
                .filter(room -> !room.isHiddenFor(currentUserId))
                .map(room -> toRoomResponse(room, currentUserId))
                .toList();
    }

    // 채팅 종료: 누른 사람 목록에서만 숨기고, 이력은 그대로 남긴다(상대방에게는 "종료된 채팅"으로 계속 보임).
    @Transactional
    public void endChat(Long currentUserId, Long roomId) {
        ChatRoom room = getRoomOrThrow(roomId);
        validateParticipant(room, currentUserId);

        room.endBy(currentUserId);
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long currentUserId, Long roomId, String content) {
        ChatRoom room = getRoomOrThrow(roomId);
        validateParticipant(room, currentUserId);
        validateActiveSubscription(room);

        if (room.isEnded()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        ChatMessage message = chatMessageRepository.save(
                ChatMessage.builder()
                        .chatRoomId(roomId)
                        .senderId(currentUserId)
                        .content(content)
                        .build()
        );

        Long recipientId = room.getMentorId().equals(currentUserId) ? room.getSubscriberId() : room.getMentorId();
        notificationService.notify(recipientId, NotificationType.NEW_CHAT_MESSAGE,
                "새 메시지가 도착했습니다.", "/chat/" + roomId);

        return ChatMessageResponse.from(message);
    }

    public Page<ChatMessageResponse> getMessages(Long currentUserId, Long roomId, Pageable pageable) {
        ChatRoom room = getRoomOrThrow(roomId);
        validateParticipant(room, currentUserId);

        return chatMessageRepository.findByChatRoomIdOrderByCreatedAtDesc(roomId, pageable)
                .map(ChatMessageResponse::from);
    }

    private ChatRoom getRoomOrThrow(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.RESOURCE_NOT_FOUND));
    }

    private void validateParticipant(ChatRoom room, Long userId) {
        if (!room.isParticipant(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }

    // 방 생성 시에만 구독을 확인하고 그 뒤로는 계속 열려 있던 문제 — 구독이 끝난(환불/만료/일반 해지 후
    // 기간 종료) 방은 과거 대화는 볼 수 있어도 새 메시지는 못 보내게 막는다. 멘토/구독자 어느 쪽이 보내든
    // 이 방이 딸린 구독이 살아있는지로 판단한다(구독자 개인이 아니라 방 자체의 권한이므로).
    private void validateActiveSubscription(ChatRoom room) {
        SubscriptionCheckResponse check = subscriptionService.checkAccessPermission(room.getSubscriberId(), room.getMentorId());
        if (!check.accessAllowed()) {
            throw new AccessDeniedException("구독이 종료된 채팅방에는 메시지를 보낼 수 없습니다.");
        }
    }

    private ChatRoomResponse toRoomResponse(ChatRoom room, Long currentUserId) {
        String mentorName = userRepository.findById(room.getMentorId()).map(u -> u.getName()).orElse("알 수 없음");
        String subscriberName = userRepository.findById(room.getSubscriberId()).map(u -> u.getName()).orElse("알 수 없음");
        return new ChatRoomResponse(
                room.getId(), room.getMentorId(), mentorName, room.getSubscriberId(), subscriberName,
                room.getCreatedAt(), room.isEnded()
        );
    }
}
