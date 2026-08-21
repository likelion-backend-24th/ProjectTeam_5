package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.MentorReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MentorReviewRepository extends JpaRepository<MentorReview, Long> {

    Optional<MentorReview> findByMentor_IdAndUser_Id(Long mentorId, Long userId);

    List<MentorReview> findByMentor_IdOrderByCreatedAtDesc(Long mentorId);

    long countByMentor_Id(Long mentorId);

    @Query("select coalesce(avg(r.rating), 0) from MentorReview r where r.mentor.id = :mentorId")
    double findAverageRatingByMentorId(@Param("mentorId") Long mentorId);

    // 멘토 대시보드 — 별점 분포 히스토그램 (rating, count) 쌍 목록
    @Query("select r.rating, count(r) from MentorReview r where r.mentor.id = :mentorId group by r.rating")
    List<Object[]> countGroupedByRating(@Param("mentorId") Long mentorId);
}
