# MVP 1

**인증**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| POST /api/auth/signup | 회원가입 | Body: email, password, name | 201 {id,email,name,role} | GUEST | 400 형식오류(email·password·name) · 409 이메일 중복 |
| POST /api/auth/login | 로그인 | Body: email, password | 200 {accessToken}(refreshToken은 쿠키) | GUEST | 401 이메일/비밀번호 불일치 |
| POST /api/auth/refresh | 토큰 재발급 | Cookie: refreshToken | 200 {accessToken}(쿠키 갱신) | GUEST | 401 refreshToken 만료·불일치 |
| POST /api/auth/logout | 로그아웃 | Cookie: refreshToken | 204 | USER | 401 |

**프로필**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| GET /api/users/me | 내 정보 조회 | - | 200 {id,email,name,interests,role,emailVerified,...} | USER | 401 |
| PATCH /api/users/me | 프로필(이름·관심사) 수정 | Body: name, interests | 200 수정된 프로필 | USER | 400 name 형식오류(1~20자) |
| PATCH /api/users/me/email | 이메일 수정 | Body: email | 200 수정된 프로필 | USER | 400 이메일 형식오류 |
| PATCH /api/users/me/password | 비밀번호 수정 | Body: currentPassword, newPassword | 200 수정된 프로필 | USER | 400 현재 비밀번호 불일치 · 400 새 비밀번호 8자 미만 |
| DELETE /api/users/me | 회원 탈퇴 | - | 204 | USER | 401 |
| GET /api/users/{userId} | 타인 프로필 공개 조회 | - | 200 {id,name,profileImageUrl,followerCount,followingCount,isFollowing} | GUEST | 404 유저 없음 |

**질문**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| POST /api/questions | 질문 등록 | Body: title, content, category, attachmentIds | 201 질문 객체 | USER | 400 title(1~100자)·content(1~20000자)·category 형식오류 |
| GET /api/questions | 질문 목록 조회 | Query: page, size | 200 {content, page, size, totalElements} | GUEST | - |
| GET /api/questions/{questionId} | 질문 상세 조회(답변 포함) | - | 200 질문+답변 목록 | GUEST | 404 질문 없음 |
| PATCH /api/questions/{questionId} | 질문 수정 | Body: title, content, category, attachmentIds | 200 수정된 질문 | USER(본인)·ADMIN | 400 형식오류 · 403 · 404 |
| DELETE /api/questions/{questionId} | 질문 삭제 | - | 204 | USER(본인)·ADMIN | 403 · 404 |

**답변**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| POST /api/questions/{questionId}/answers | 답변 등록 | Body: content, parentId | 201 답변 객체 | USER | 400 content 형식오류(1~2000자) · 404 질문 없음 |
| PATCH /api/answers/{answerId} | 답변 수정 | Body: content | 200 수정된 답변 | USER(본인)·ADMIN | 403 · 404 |
| DELETE /api/answers/{answerId} | 답변 삭제 | - | 204 | USER(본인)·ADMIN | 403 · 404 |

**멘토 신청**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| POST /api/users/me/mentor/application | 멘토 신청 | - | 200 | USER | 409 이미 대기중 신청 존재 |
| GET /api/users/me/mentor/application | 본인 신청 상태 조회 | - | 200 {status, dateTime} | USER | 404 신청 이력 없음 |
| GET /api/admin/mentors/applications | 신청 대기 목록 조회 | - | 200 [유저 목록] | ADMIN | 403 |
| PATCH /api/admin/mentors/{userId}/approval | 신청 승인 | - | 200 | ADMIN | 403 · 404 |
| PATCH /api/admin/mentors/{userId}/rejection | 신청 거절 | - | 200 | ADMIN | 403 · 404 |

**회원 관리(관리자)**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| DELETE /api/admin/users/{userId} | 회원 강제 삭제(하드, CASCADE) | - | 200 | ADMIN | 403 · 404 |

# MVP 2

**팔로우 · 피드 · 좋아요**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| POST /api/users/{userId}/follow | 팔로우/언팔로우 토글 | - | 200 | USER | 401 |
| GET /api/questions/following | 팔로우한 유저의 질문 피드 | Query: page, size | 200 {content,...} | USER | 401 |
| POST /api/v1/mentors/{mentorId}/posts/{postId}/likes | 게시글 좋아요 | - | 200 | USER | 401 |
| DELETE /api/v1/mentors/{mentorId}/posts/{postId}/likes | 좋아요 취소 | - | 200 | USER | 401 |
| POST /api/questions/{questionId}/like | 질문 좋아요 토글 | - | 200 {isLiked, likeCount} | USER | 401 |

**멘토 목록 · 프로필 · 리뷰**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| GET /api/mentors | 멘토 목록 조회·검색 | Query: keyword, page, size | 200 {content,...} | **USER** | 401 |
| GET /api/mentors/{mentorId} | 멘토 상세 조회 | - | 200 멘토 프로필 객체 | **USER** | 401,404 |
| PUT /api/mentors/{mentorId} | 멘토 프로필 등록·수정 | Body: bio, company, career, tags, education, schedule, subscriptionPrice, portfolioUrl | 200 수정된 프로필 | MENTOR(본인) | 403 |
| GET /api/mentors/{mentorId}/reviews | 리뷰 목록 조회 | - | 200 [리뷰 목록] | **USER** | 401 |
| POST /api/mentors/{mentorId}/reviews | 리뷰 작성·수정(덮어쓰기) | Body: rating(1~5), comment(최대 1000자) | 201 리뷰 객체 | USER(구독 이력 필요) | 400 rating 범위 초과 · 403 구독 이력 없음 |
| DELETE /api/mentors/{mentorId}/reviews/{reviewId} | 리뷰 삭제 | - | 204 | USER(본인) | 403 |
| GET /api/mentors/me/dashboard/** | 멘토 대시보드 조회 | - | 200 대시보드 데이터 | MENTOR(본인) | 401 |

**멘토 신청 - 이메일 인증**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| POST /api/users/me/email/verification-code | 인증번호 발송 | Body: email | 200 | USER | 409 이미 사용중인 이메일 |
| POST /api/users/me/email/verify | 인증번호 검증 | Body: email, code | 200 인증 완료된 프로필 | USER | 400 코드 불일치·만료(5분) |

**구독 · 결제**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| GET /api/v1/subscriptions/check?mentorId= | 구독 권한(페이월) 확인 | Query: mentorId | 200 {accessAllowed} | USER | 401 |
| POST /api/v1/subscriptions?planid= | 구독 신청(등록 카드로 즉시 결제) | Query: planid, Body: mentorId | 201 결제 결과 객체 | USER | 400 결제 실패 |
| GET /api/v1/subscriptions/me | 내 구독 목록 조회 | - | 200 [구독 목록] | USER | 401 |
| GET /api/v1/subscriptions/{subscriptionId}/payments | 구독별 결제 내역 조회 | - | 200 [결제 내역] | USER(본인) | 403 |
| PATCH /api/v1/subscriptions/{subscriptionId}/cancel | 구독 해지 신청 | - | 200 | USER(본인) | 403 |
| POST /api/v1/mentors/{mentorId}/plans | 요금제 등록 | Body: planName, description, price, billingCycle | 201 요금제 객체 | MENTOR(본인) | 400 price·planName 형식오류 · 403 |
| GET /api/v1/mentors/{mentorId}/plans | 요금제 목록 조회 | - | 200 [요금제 목록] | GUEST | - |
| PUT /api/v1/mentors/{mentorId}/plans/{planId} | 요금제 수정 | Body: planName, description, price, billingCycle | 200 수정된 요금제 | MENTOR(본인) | 403 |
| DELETE /api/v1/mentors/{mentorId}/plans/{planId} | 요금제 삭제(비활성화) | - | 204 | MENTOR(본인) | 403 |
| POST /api/payment-methods/prepare | 빌링키 발급 준비 | - | 200 {issueId,...} | USER | 401 |
| POST /api/payment-methods | 결제수단 등록 | Body: cardNickname, issueId, billingKey, phoneNumber | 201 결제수단 객체 | USER | 400 필수값 누락 |
| GET /api/payment-methods | 결제수단 목록 조회 | - | 200 [결제수단 목록] | USER | 401 |
| PATCH /api/payment-methods/{id}/default | 기본 결제수단 설정 | - | 200 | USER(본인) | 403 |
| DELETE /api/payment-methods/{id} | 결제수단 삭제 | - | 204 | USER(본인) | 403 |
| POST /api/v1/payments/{paymentId}/complete | 결제 완료 검증 | - | 200 결제 결과 객체 | USER | 400 결제 검증 실패 |
| POST /api/v1/payments/{paymentId}/cancellations | 환불 요청 | Body: reason | 201 환불 요청 객체 | USER | 400 사유 누락 |
| GET /api/v1/payments/cancellations/me | 내 환불 요청 이력 조회 | - | 200 [환불 이력] | USER | 401 |

**멘토 전용 게시판**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| GET /api/v1/mentors/{mentorId}/posts | 게시글 목록 조회(비구독자 잠금) | - | 200 [게시글 목록(잠금 표시 포함)] | GUEST | - |
| POST /api/v1/mentors/{mentorId}/posts | 게시글 작성 | Body: title, content, category, isPublic, attachmentIds | 201 게시글 객체 | MENTOR(본인) | 403 |
| GET /api/v1/mentors/{mentorId}/posts/{postId} | 게시글 상세 조회 | - | 200 게시글 객체 | 구독자·MENTOR(본인) | 403 미구독 · 404 |
| PUT /api/v1/mentors/{mentorId}/posts/{postId} | 게시글 수정 | Body: title, content, category, isPublic, attachmentIds | 200 수정된 게시글 | MENTOR(본인) | 403 |
| DELETE /api/v1/mentors/{mentorId}/posts/{postId} | 게시글 삭제 | - | 200 | MENTOR(본인) | 403 |
| GET /api/v1/mentors/{mentorId}/posts/{postId}/comments | 댓글 목록 조회 | - | 200 [댓글 목록] | GUEST | - |
| POST /api/v1/mentors/{mentorId}/posts/{postId}/comments | 댓글 작성 | Body: content | 201 댓글 객체 | USER | 401 |
| DELETE /api/v1/mentors/{mentorId}/posts/{postId}/comments/{commentId} | 댓글 삭제 | - | 204 | USER(본인) | 403 |

**멘토 1:1 채팅**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| POST /api/v1/mentors/{mentorId}/chat-room | 채팅방 생성·재활성화 | - | 200 채팅방 객체 | 구독자 | 403 미구독 |
| GET /api/v1/chat-rooms/me | 내 채팅방 목록 조회 | - | 200 [채팅방 목록] | USER | 401 |
| POST /api/v1/chat-rooms/{roomId}/messages | 메시지 전송 | Body: content | 201 메시지 객체 | 참여자 | 403 · 404 |
| GET /api/v1/chat-rooms/{roomId}/messages | 메시지 목록 조회 | - | 200 [메시지 목록] | 참여자 | 403 |
| DELETE /api/v1/chat-rooms/{roomId} | 채팅 종료(본인에게만 숨김) | - | 204 | 참여자 | 403 |

**정산**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| GET /api/v1/settlement-accounts/me | 정산 계좌 조회 | - | 200 계좌 객체 | MENTOR(본인) | 401 |
| POST /api/v1/settlement-accounts/me | 정산 계좌 등록·수정 | Body: bankName, accountNumber, accountHolder | 200 계좌 객체 | MENTOR(본인) | 400 형식오류(자릿수·자모분리) |
| GET /api/v1/settlements/me | 정산 내역 조회 | - | 200 [정산 목록] | MENTOR(본인) | 401 |
| POST /api/v1/settlements/me/request-withdrawal | 출금 신청 | - | 200 | MENTOR(본인) | 400 출금 가능 금액 없음 |
| GET /api/admin/settlements | 전체 정산 목록 조회 | - | 200 [정산 목록] | ADMIN | 403 |
| PATCH /api/admin/settlements/{id}/complete | 정산(출금) 완료 처리 | - | 200 | ADMIN | 403 |

**알림**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| GET /api/v1/notifications | 알림 목록 조회 | Query: page, size | 200 [알림 목록] | USER | 401 |
| GET /api/v1/notifications/unread-count | 안읽은 알림 개수 조회 | - | 200 {count} | USER | 401 |
| PATCH /api/v1/notifications/{notificationId}/read | 알림 읽음 처리 | - | 200 | USER(본인) | 403 |
| PATCH /api/v1/notifications/read-all | 전체 읽음 처리 | - | 200 | USER | 401 |
| DELETE /api/v1/notifications/read | 읽은 알림 일괄 삭제 | - | 204 | USER | 401 |
| DELETE /api/v1/notifications/{notificationId} | 알림 삭제 | - | 204 | USER(본인) | 403 |

**관리자(회원·환불)**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| GET /api/admin/users | 전체 회원 목록 조회 | - | 200 [회원 목록] | ADMIN | 403 |
| GET /api/admin/users/search | 회원 검색·필터·페이지네이션 | Query: page, size, keyword, role, sort | 200 {content,...} | ADMIN | 403 |
| PATCH /api/admin/users/{userId}/block | 회원 차단 | - | 200 | ADMIN | 403 |
| PATCH /api/admin/users/{userId}/unblock | 회원 차단 해제 | - | 200 | ADMIN | 403 |
| GET /api/admin/cancellations | 환불 요청 목록 조회 | - | 200 [환불 목록] | ADMIN | 403 |
| PATCH /api/admin/cancellations/{id}/approve | 환불 승인 | - | 200 | ADMIN | 403 |
| PATCH /api/admin/cancellations/{id}/reject | 환불 거절 | Body: adminNote | 200 | ADMIN | 403 |

**1:1 문의 · 첨부파일**

| API | 설명 | 요청 | 응답 | 인증/권한 | 예외 |
| --- | --- | --- | --- | --- | --- |
| POST /api/v1/inquiries | 문의 등록 | Body: category, email, title, content | 200 | GUEST | 400 필수값 누락 |
| GET /api/admin/inquiries | 문의 목록 조회 | - | 200 [문의 목록] | ADMIN | 403 |
| PATCH /api/admin/inquiries/{id}/status | 문의 상태 변경 | Body: status | 200 | ADMIN | 403 |
| POST /api/attachments/images/signature | 이미지 업로드 서명 발급 | - | 200 {signature,...} | USER | 401 |
| POST /api/attachments/profile-image/signature | 프로필 이미지 업로드 서명 발급 | - | 200 {signature,...} | USER | 401 |
| POST /api/attachments/files | 파일 업로드 | Body(form-data): file | 201 파일 객체 | USER | 400 |
| GET /api/attachments/files/{attachId}/download | 파일 다운로드 | - | 200 파일 스트림 | 소유자 | 403 |