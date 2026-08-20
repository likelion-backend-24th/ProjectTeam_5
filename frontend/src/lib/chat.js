import { request } from "./client";

export function getOrCreateChatRoom(mentorId) {
  return request(`/api/v1/mentors/${mentorId}/chat-room`, {
    method: "POST",
    fallbackMessage: "채팅방을 시작하지 못했습니다.",
  });
}

export function getMyChatRooms() {
  return request("/api/v1/chat-rooms/me", {
    method: "GET",
    fallbackMessage: "채팅방 목록을 불러오지 못했습니다.",
  });
}

export function sendChatMessage(roomId, content) {
  return request(`/api/v1/chat-rooms/${roomId}/messages`, {
    method: "POST",
    body: { content },
    fallbackMessage: "메시지 전송에 실패했습니다.",
  });
}

export function getChatMessages(roomId) {
  return request(`/api/v1/chat-rooms/${roomId}/messages`, {
    method: "GET",
    fallbackMessage: "메시지를 불러오지 못했습니다.",
  });
}
