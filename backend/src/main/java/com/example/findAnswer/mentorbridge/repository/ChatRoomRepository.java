package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByMentorIdAndSubscriberId(Long mentorId, Long subscriberId);

    List<ChatRoom> findByMentorIdOrSubscriberId(Long mentorId, Long subscriberId);
}
