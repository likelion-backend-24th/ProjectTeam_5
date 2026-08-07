package com.example.findAnswer.dev.repository;


import com.example.findAnswer.dev.domain.Provider;
import com.example.findAnswer.dev.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    Optional<OAuthAccount> findByProviderAndProviderUserId(Provider provider,String providerUserId);

    @Query("""
        select oa
        from OAuthAccount oa
        join fetch oa.user u
        where oa.provider = :provider
          and oa.providerUserId = :providerUserId
        """)
    Optional<OAuthAccount> findWithUserByProviderAndProviderUserId(
            @Param("provider") Provider provider,
            @Param("providerUserId") String providerUserId
    );
}
