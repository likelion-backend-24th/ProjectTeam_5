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
    Page<Question> findAll(Pageable pageable);

    // 제목, 본문으로 질문 검색
    Page<Question> findByTitleContainingOrContentContaining(String title, String content, Pageable pageable);

    // 🚀 [추가] 카테고리 + 검색어 동시 조회
    @Query("SELECT q FROM Question q WHERE q.category = :category AND (q.title LIKE %:keyword% OR q.content LIKE %:keyword%)")
    @EntityGraph(attributePaths = {"user"})
    Page<Question> findByCategoryAndKeyword(@Param("category") String category, @Param("keyword") String keyword, Pageable pageable);

    Page<Question> findByCategory(String category, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Question q SET q.likeCount = q.likeCount + 1 WHERE q.id = :id")
    void incrementLikeCount(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Question q SET q.likeCount = q.likeCount - 1 WHERE q.id = :id AND q.likeCount > 0")
    void decrementLikeCount(@Param("id") Long id);

    @EntityGraph(attributePaths = {"user"})
    Page<Question> findByUserId(Long userId, Pageable pageable);

    // --- 🚀 답변 많은순 정렬 전용 쿼리들 ---
    @Query("SELECT q FROM Question q ORDER BY SIZE(q.answers) DESC, q.id DESC")
    @EntityGraph(attributePaths = {"user"})
    Page<Question> findAllOrderByAnswersDesc(Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.category = :category ORDER BY SIZE(q.answers) DESC, q.id DESC")
    @EntityGraph(attributePaths = {"user"})
    Page<Question> findByCategoryOrderByAnswersDesc(@Param("category") String category, Pageable pageable);

    @Query("SELECT q FROM Question q WHERE q.title LIKE %:keyword% OR q.content LIKE %:keyword% ORDER BY SIZE(q.answers) DESC, q.id DESC")
    @EntityGraph(attributePaths = {"user"})
    Page<Question> findByKeywordOrderByAnswersDesc(@Param("keyword") String keyword, Pageable pageable);

    // 🚀 [추가] 카테고리 + 검색어 + 답변 많은순 정렬
    @Query("SELECT q FROM Question q WHERE q.category = :category AND (q.title LIKE %:keyword% OR q.content LIKE %:keyword%) ORDER BY SIZE(q.answers) DESC, q.id DESC")
    @EntityGraph(attributePaths = {"user"})
    Page<Question> findByCategoryAndKeywordOrderByAnswersDesc(@Param("category") String category, @Param("keyword") String keyword, Pageable pageable);
}