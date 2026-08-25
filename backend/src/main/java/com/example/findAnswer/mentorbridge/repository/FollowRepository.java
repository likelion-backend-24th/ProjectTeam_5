package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollowerIdAndFolloweeId(Long followerId, Long followeeId);
    Optional<Follow> findByFollowerIdAndFolloweeId(Long followerId, Long followeeId);
    long countByFolloweeId(Long followeeId); // 나를 팔로우하는 사람 수 (팔로워)
    long countByFollowerId(Long followerId); // 내가 팔로우하는 사람 수 (팔로잉)
    void deleteByFollowerIdOrFolloweeId(Long followerId, Long followeeId);
}