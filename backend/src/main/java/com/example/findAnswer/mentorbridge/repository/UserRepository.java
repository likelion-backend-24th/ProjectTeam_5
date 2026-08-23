package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    List<User> findAllByDeletedAtIsNull();

    List<User> findAllByRole(Role role);

    // [관리자] 전체 회원 목록 페이지네이션 조회(탈퇴한 계정 포함) — role 미지정 시 전체, keyword 미지정 시 필터 없음.
    @Query("SELECT u FROM User u WHERE " +
            "(:role IS NULL OR u.role = :role) AND " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "  LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "  LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchForAdmin(
            @Param("role") Role role,
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("SELECT u FROM User u LEFT JOIN u.mentorProfile p WHERE u.role = 'MENTOR' AND u.deletedAt IS NULL " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "    LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(p.bio) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(p.tags) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findMentors(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    @Query("""
    select u
    from User u
    where u.deletedAt is null
    and exists (
        select 1
        from MentorPlan mp
        where mp.mentor.id = u.id
          and mp.isActive = true
    )
    and (
        :keyword is null
        or :keyword = ''
        or lower(u.name) like lower(concat('%', :keyword, '%'))
    )
    """)
    Page<User> findActivePlanMentors(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}