package com.example.findAnswer.mentorbridge.repository;


import com.example.findAnswer.mentorbridge.constants.Provider;
import com.example.findAnswer.mentorbridge.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    Optional<OAuthAccount> findByProviderAndProviderUserId(Provider provider,String providerUserId);
    List<OAuthAccount> findAllByUserId(Long userId);

    @Modifying(clearAutomatically = true) // delete update 쿼리는 Modifying 추가
    @Query("""
        delete
        from
        OAuthAccount oa
        where
        oa.user.id = :userId
    """)
    void deleteByUserId(@Param("userId") Long userId);
}
