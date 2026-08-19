package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    @EntityGraph(attributePaths = {"user"})
    Page<Question> findAll(Pageable pageable); // 등록된 전체 질문 최신순으로 조회

    //제목, 본문으로 질문 검색
    Page<Question> findByTitleContainingOrContentContaining(String title, String content , Pageable pageable);

    Page<Question> findByCategory(String category, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Question q SET q.likeCount = q.likeCount + 1 WHERE q.id = :id")
    void incrementLikeCount(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Question q SET q.likeCount = q.likeCount - 1 WHERE q.id = :id AND q.likeCount > 0")
    void decrementLikeCount(@Param("id") Long id);

    @EntityGraph(attributePaths = {"user"})
    Page<Question> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT DISTINCT q FROM Question q JOIN q.answers a WHERE a.user.id = :userId")
    Page<Question> findQuestionsByAnsweredUserId(@Param("userId") Long userId, Pageable pageable);

    // 팔로우한 유저들의 질문 목록 조회
    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT q FROM Question q WHERE q.user.id IN (SELECT f.followee.id FROM Follow f WHERE f.follower.id = :userId)")
    Page<Question> findByFollowingUsers(@Param("userId") Long userId, Pageable pageable);
}
