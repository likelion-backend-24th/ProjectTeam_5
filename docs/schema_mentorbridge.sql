-- MentorBridge Database Schema (DDL)
-- Generated for MySQL / MariaDB Dialect based on JPA Entities

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users & Core Authentication
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NULL,
    password VARCHAR(255) NULL,
    name VARCHAR(50) NOT NULL,
    interests VARCHAR(100) NULL,
    role VARCHAR(30) NOT NULL,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at DATETIME(6) NULL,
    profile_image_url VARCHAR(255) NULL,
    phone_number VARCHAR(20) NULL,
    bio VARCHAR(500) NULL,
    introduction VARCHAR(2000) NULL,
    careers VARCHAR(1000) NULL,
    location VARCHAR(100) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. OAuth Accounts
DROP TABLE IF EXISTS oauth_accounts;
CREATE TABLE oauth_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    CONSTRAINT uk_oauth_provider_user UNIQUE (provider, provider_user_id),
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Email Verification
DROP TABLE IF EXISTS email_verifications;
CREATE TABLE email_verifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Refresh Tokens
DROP TABLE IF EXISTS refresh_tokens;
CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Mentor Applications
DROP TABLE IF EXISTS mentor_applications;
CREATE TABLE mentor_applications (
    mentor_application_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    introduction TEXT NULL,
    career_summary VARCHAR(255) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_mentor_applications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Mentor Profiles
DROP TABLE IF EXISTS mentor_profiles;
CREATE TABLE mentor_profiles (
    mentor_profile_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    bio VARCHAR(1000) NULL,
    company VARCHAR(255) NULL,
    career VARCHAR(255) NULL,
    tags VARCHAR(255) NULL,
    education VARCHAR(255) NULL,
    schedule VARCHAR(255) NULL,
    portfolio_url VARCHAR(255) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_mentor_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Follows
DROP TABLE IF EXISTS follows;
CREATE TABLE follows (
    follow_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    follower_id BIGINT NOT NULL,
    followee_id BIGINT NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT uq_follows_follower_followee UNIQUE (follower_id, followee_id),
    CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_follows_followee FOREIGN KEY (followee_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Mentor Plans
DROP TABLE IF EXISTS mentor_plan;
CREATE TABLE mentor_plan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    price INT NOT NULL,
    billing_cycle INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_mentor_plan_mentor FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Payment Methods
DROP TABLE IF EXISTS payment_methods;
CREATE TABLE payment_methods (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    payment_provider VARCHAR(20) NOT NULL,
    payment_method_status VARCHAR(20) NOT NULL,
    billing_key VARCHAR(255) NULL,
    card_brand VARCHAR(30) NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    card_nickname VARCHAR(50) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_payment_methods_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Billing Key Issuance Intents
DROP TABLE IF EXISTS billing_key_issuance_intent;
CREATE TABLE billing_key_issuance_intent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_id VARCHAR(100) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    store_id VARCHAR(100) NULL,
    channel_key VARCHAR(100) NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Subscriptions
DROP TABLE IF EXISTS subscription;
CREATE TABLE subscription (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    mentor_id BIGINT NOT NULL,
    plan_id BIGINT NULL,
    payment_method_id BIGINT NULL,
    status VARCHAR(50) NOT NULL,
    amount INT NOT NULL,
    current_period_start DATETIME(6) NOT NULL,
    current_period_end DATETIME(6) NOT NULL,
    next_billing_at DATETIME(6) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT uk_user_mentor UNIQUE (user_id, mentor_id),
    CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_mentor FOREIGN KEY (mentor_id) REFERENCES users (id),
    CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES mentor_plan (id),
    CONSTRAINT fk_subscription_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Payments
DROP TABLE IF EXISTS payment;
CREATE TABLE payment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    subscription_id BIGINT NOT NULL,
    cycle_no INT NOT NULL,
    attempt_no INT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    store_id VARCHAR(100) NULL,
    channel_key VARCHAR(100) NULL,
    paid_at DATETIME(6) NULL,
    schedule_id VARCHAR(100) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_payment_subscription FOREIGN KEY (subscription_id) REFERENCES subscription (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Payment Transactions
DROP TABLE IF EXISTS payment_transaction;
CREATE TABLE payment_transaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount BIGINT NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    approved_at DATETIME(6) NULL,
    raw_snapshot LONGTEXT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_payment_transaction_payment FOREIGN KEY (payment_id) REFERENCES payment (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Payment Cancellations
DROP TABLE IF EXISTS payment_cancellation;
CREATE TABLE payment_cancellation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    requested_by_user_id BIGINT NOT NULL,
    cancellation_id VARCHAR(100) NULL,
    amount BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    reason VARCHAR(500) NULL,
    admin_note VARCHAR(500) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_payment_cancellation_payment FOREIGN KEY (payment_id) REFERENCES payment (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Webhook Events
DROP TABLE IF EXISTS webhook_event;
CREATE TABLE webhook_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    webhook_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100) NULL,
    payload LONGTEXT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Settlement Accounts
DROP TABLE IF EXISTS settlement_accounts;
CREATE TABLE settlement_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    bank_name VARCHAR(50) NOT NULL,
    account_number VARCHAR(255) NOT NULL, -- AES-256-GCM Encrypted
    account_holder VARCHAR(50) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_settlement_accounts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Settlements
DROP TABLE IF EXISTS settlements;
CREATE TABLE settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    mentor_id BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,
    pg_fee BIGINT NOT NULL,
    platform_fee BIGINT NOT NULL,
    net_amount BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_settlements_payment FOREIGN KEY (payment_id) REFERENCES payment (id),
    CONSTRAINT fk_settlements_mentor FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Mentor Reviews
DROP TABLE IF EXISTS mentor_review;
CREATE TABLE mentor_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT NOT NULL,
    comment VARCHAR(1000) NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT uk_mentor_review_mentor_user UNIQUE (mentor_id, user_id),
    CONSTRAINT fk_mentor_review_mentor FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_review_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Questions
DROP TABLE IF EXISTS questions;
CREATE TABLE questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    like_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_questions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Answers
DROP TABLE IF EXISTS answers;
CREATE TABLE answers (
    answer_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    parent_id BIGINT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (id),
    CONSTRAINT fk_answers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_parent FOREIGN KEY (parent_id) REFERENCES answers (answer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Question Likes
DROP TABLE IF EXISTS likes;
CREATE TABLE likes (
    like_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME(6) NULL,
    CONSTRAINT uq_likes_user_question UNIQUE (user_id, question_id),
    CONSTRAINT fk_likes_question FOREIGN KEY (question_id) REFERENCES questions (id),
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Mentor Posts
DROP TABLE IF EXISTS mentor_post;
CREATE TABLE mentor_post (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(255) NULL DEFAULT '일반',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_mentor_post_mentor FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Mentor Post Comments
DROP TABLE IF EXISTS mentor_post_comments;
CREATE TABLE mentor_post_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_mentor_post_comments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Mentor Post Likes
DROP TABLE IF EXISTS mentor_post_like;
CREATE TABLE mentor_post_like (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    mentor_post_id BIGINT NOT NULL,
    CONSTRAINT fk_mentor_post_like_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_post_like_post FOREIGN KEY (mentor_post_id) REFERENCES mentor_post (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Mentor Post View Logs
DROP TABLE IF EXISTS mentor_post_view_log;
CREATE TABLE mentor_post_view_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    post_id BIGINT NULL,
    CONSTRAINT fk_mentor_post_view_log_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Question Attachment Files
DROP TABLE IF EXISTS question_attachment_files;
CREATE TABLE question_attachment_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NULL,
    mentor_post_id BIGINT NULL,
    uploader_id BIGINT NOT NULL,
    attachment_type VARCHAR(20) NOT NULL,
    attachment_status VARCHAR(20) NOT NULL,
    storage_key VARCHAR(500) UNIQUE NOT NULL,
    original_file_name VARCHAR(255) NULL,
    size BIGINT NULL,
    created_at DATETIME(6) NULL,
    updated_at DATETIME(6) NULL,
    CONSTRAINT fk_attachment_question FOREIGN KEY (question_id) REFERENCES questions (id),
    CONSTRAINT fk_attachment_mentor_post FOREIGN KEY (mentor_post_id) REFERENCES mentor_post (id) ON DELETE CASCADE,
    CONSTRAINT fk_attachment_uploader FOREIGN KEY (uploader_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Chat Rooms
DROP TABLE IF EXISTS chat_room;
CREATE TABLE chat_room (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    mentor_id BIGINT NOT NULL,
    subscriber_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    ended_by BIGINT NULL,
    CONSTRAINT uk_chat_room_mentor_subscriber UNIQUE (mentor_id, subscriber_id),
    CONSTRAINT fk_chat_room_mentor FOREIGN KEY (mentor_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_room_subscriber FOREIGN KEY (subscriber_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. Chat Messages
DROP TABLE IF EXISTS chat_message;
CREATE TABLE chat_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    chat_room_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_chat_message_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. Notifications
DROP TABLE IF EXISTS notification;
CREATE TABLE notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id BIGINT NOT NULL,
    type VARCHAR(40) NOT NULL,
    message VARCHAR(255) NOT NULL,
    link VARCHAR(255) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. Inquiries
DROP TABLE IF EXISTS inquiries;
CREATE TABLE inquiries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
