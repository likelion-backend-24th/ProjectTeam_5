package com.example.findAnswer.mentorbridge.controller;

import com.example.findAnswer.mentorbridge.dto.chat.ChatMessageRequest;
import com.example.findAnswer.mentorbridge.dto.chat.ChatMessageResponse;
import com.example.findAnswer.mentorbridge.dto.chat.ChatRoomResponse;
import com.example.findAnswer.mentorbridge.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 신원 확인은 전부 @AuthenticationPrincipal(JWT 기반)로 처리한다 — X-USER-ID 헤더는 쓰지 않는다.
// SecurityConfig에는 별도 규칙을 추가하지 않았다: 이 컨트롤러의 모든 경로는 anyRequest().authenticated()로
// "로그인만 하면 통과"되고, 실제 "이 방의 당사자인지" 검증은 ChatService.validateParticipant()가 담당한다.
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // F-27: 멘토와의 채팅방 생성/조회 (구독 중인 멘토에게만 가능)
    @PostMapping("/mentors/{mentorId}/chat-room")
    public ResponseEntity<ChatRoomResponse> getOrCreateRoom(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long mentorId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.getOrCreateRoom(currentUserId, mentorId));
    }

    // F-27: 내 채팅방 목록 (멘토/구독자 양쪽 다 이 API 하나로 조회)
    @GetMapping("/chat-rooms/me")
    public ResponseEntity<List<ChatRoomResponse>> getMyRooms(@AuthenticationPrincipal Long currentUserId) {
        return ResponseEntity.ok(chatService.getMyRooms(currentUserId));
    }

    // F-27: 메시지 전송
    @PostMapping("/chat-rooms/{roomId}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long roomId,
            @Valid @RequestBody ChatMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.sendMessage(currentUserId, roomId, request.content()));
    }

    // F-27: 메시지 목록 조회 (최신순 페이징)
    @GetMapping("/chat-rooms/{roomId}/messages")
    public ResponseEntity<Page<ChatMessageResponse>> getMessages(
            @AuthenticationPrincipal Long currentUserId,
            @PathVariable Long roomId,
            @PageableDefault(size = 30) Pageable pageable) {
        return ResponseEntity.ok(chatService.getMessages(currentUserId, roomId, pageable));
    }
}
