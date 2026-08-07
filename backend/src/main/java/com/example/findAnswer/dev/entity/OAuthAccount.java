package com.example.findAnswer.dev.entity;

import com.example.findAnswer.dev.domain.Provider;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "oauth_accounts",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_oauth_provider_user",
                    columnNames = {
                            "provider",
                            "provider_user_id"
                    }
            )
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OAuthAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Provider provider;

    @Column(name = "provider_user_id", nullable = false)
    private String providerUserId;


}
