package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.BillingKeyIssuanceIntent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BillingKeyIssuanceIntentRepository extends JpaRepository<BillingKeyIssuanceIntent, Long> {
    Optional<BillingKeyIssuanceIntent> findByIssueId(String issueId);
}
