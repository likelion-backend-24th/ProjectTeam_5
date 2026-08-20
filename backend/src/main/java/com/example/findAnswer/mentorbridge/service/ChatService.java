package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
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

        return toRoomResponse(room);
    }

    public List<ChatRoomResponse> getMyRooms(Long currentUserId) {
        return chatRoomRepository.findByMentorIdOrSubscriberId(currentUserId, currentUserId)
                .stream()
                .map(this::toRoomResponse)
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(Long currentUserId, Long roomId, String content) {
        ChatRoom room = getRoomOrThrow(roomId);
        validateParticipant(room, currentUserId);

        ChatMessage message = chatMessageRepository.save(
                ChatMessage.builder()
                        .chatRoomId(roomId)
                        .senderId(currentUserId)
                        .content(content)
                        .build()
        );

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

    private ChatRoomResponse toRoomResponse(ChatRoom room) {
        String mentorName = userRepository.findById(room.getMentorId()).map(u -> u.getName()).orElse("알 수 없음");
        String subscriberName = userRepository.findById(room.getSubscriberId()).map(u -> u.getName()).orElse("알 수 없음");
        return new ChatRoomResponse(room.getId(), room.getMentorId(), mentorName, room.getSubscriberId(), subscriberName, room.getCreatedAt());
    }
}
