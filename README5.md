# FindAnswer (MentorBridge)

> 궁금한 것을 질문하면 승인된 멘토가 답해주고, 마음에 드는 멘토는 요금제를 구독해 전용 아티클과 1:1 채팅까지 이용하는 유료 구독형 Q&A 멘토링 플랫폼입니다.

| 구분 | 링크 |
| --- | --- |
| 서비스 | https://like-lion-team5-find-answer.vercel.app |
| API 문서 | 로컬 실행 후 Swagger UI `http://localhost:8080/swagger-ui/index.html` |
| 헬스체크 | `http://localhost:8080/health` (Actuator + Prometheus) |

> 멋쟁이사자처럼 백엔드 24기 5팀 포트폴리오 프로젝트입니다.

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 개발 기간 | <!-- TODO: 2026.MM.DD ~ 2026.MM.DD --> |
| 팀 구성 | Backend 4명 (프론트엔드 공통 작업 병행) |
| 주요 사용자 | 실무 질문에 답을 찾는 학생·주니어와, 지식을 유료로 제공하려는 현직자 |
| 해결하려는 문제 | 질문은 커뮤니티에, 깊은 상담은 유료 플랫폼에 흩어져 있어 "무료 Q&A → 특정 멘토 심화"로 이어지는 경로가 없습니다. |
| 핵심 가치 | 무료 질문·답변으로 멘토를 먼저 발견하게 하고, 그 멘토를 구독하면 전용 아티클·1:1 채팅으로 연결되도록 만들었습니다. |

### 핵심 사용자 흐름

```text
회원가입/소셜 로그인 → 질문 작성 → 멘토 답변 → 멘토 프로필 발견
                                                      │
                            멘토 신청 → 관리자 승인 → 멘토 활동(아티클·요금제)
                                                      │
                             결제수단(빌링키) 등록 → 요금제 구독(즉시 청구)
                                                      └→ 멘토 전용 아티클 · 1:1 채팅
```

## 핵심 기능

### 회원 인증 · 계정

- 이메일 회원가입과 Google·Kakao 소셜 로그인(OAuth2)을 지원하고, 프로필·이메일(인증코드 확인)·비밀번호 변경과 회원 탈퇴(OAuth 연결 해제 포함)를 제공합니다.
- Access Token(15분)은 `Authorization: Bearer` 헤더로, Refresh Token(14일)은 `HttpOnly` 쿠키로 발급합니다. Refresh Token은 DB에 **원문이 아닌 해시값**으로 저장하고 재발급 때마다 회전(rotation)시킵니다.
- 비밀번호는 BCrypt로 해싱하며, 현재 비밀번호 불일치는 `PASSWORD_MISMATCH`로 구분해 인증 오류와 다른 메시지를 내려줍니다.

### 질문 · 답변

- 카테고리별 질문 작성/수정/삭제(작성자 본인만), 키워드 검색과 페이징(기본 10건), 좋아요 토글, 팔로우한 유저의 질문 피드를 제공합니다.
- 답변은 부모-자식 self-reference 구조라 **대댓글(답변의 답변)** 이 가능하고, 질문에는 첨부파일을 올리고 내려받을 수 있습니다.
- 비로그인 상태에서 좋아요·팔로우·답변을 시도하면 로그인 페이지로 튕기지 않고, 작성 중이던 내용을 유지한 채 안내 메시지만 노출합니다.

### 멘토

- 일반 사용자가 멘토를 신청하면 관리자 승인 시 `USER` → `MENTOR`로 승격됩니다.
- 멘토 목록은 이름·소개·태그로 검색하고, **전문 분야(카테고리)와 경력 구간**으로 필터링합니다. 필터 선택지와 프로필 편집 폼의 선택지는 `constants/mentorOptions.js` 한 곳에서 공유해 값이 어긋날 수 없게 했습니다.
- **멘토 아티클**: 마크다운 글 작성/수정/삭제, 좋아요, 조회 기록. 유료 아티클은 구독자에게만 본문을 내려주고, 비구독자에게는 잠금 상태(제목·요약만)로 응답합니다.
- **멘토 리뷰**: 구독 이력이 있는 유저만 작성할 수 있고, 본인 리뷰만 수정·삭제합니다.
- **멘토 대시보드**: 요약 지표, 기간별 트렌드, 평점 히스토그램, 프로필 완성도, 최근 글·리뷰, 구독자 목록, 결제 내역, 대기 중인 환불 요청.

### 요금제 · 구독 · 결제 (PortOne V2)

- 멘토가 요금제(Plan)를 등록하면, 멘티는 등록해 둔 결제수단(빌링키)으로 **결제창 없이 서버가 즉시 청구**하는 방식으로 구독합니다.
- 결제 확정은 PG 즉시 응답이 아니라 **PortOne 단건 재조회**로 판정합니다. 웹훅은 서명(`webhook-signature`)을 원문 바디 기준으로 검증한 뒤 `WebhookEvent` 유니크 제약으로 멱등 처리합니다.
- 구독 해지 예약, 멘토별 접근 권한 검증, 내 구독·결제 이력 조회를 제공하고, 환불은 멘티 요청 → 관리자 승인 시 PortOne 취소 API를 실호출합니다.
- 스케줄러가 만료된 구독을 정리합니다(`subscription.expire-cron`, 기본 매시 5분).

### 정산

- 멘토가 출금을 신청하면 `REQUESTED` 상태로 쌓이고, 관리자가 승인해야 `COMPLETED`로 넘어갑니다. 상태 전이는 엔티티(`Settlement.complete()`)가 직접 막아 이미 완료된 건을 다시 완료 처리할 수 없습니다.
- 정산 계좌번호는 JPA `AttributeConverter`로 **AES-256-GCM 암호화**해 저장하고, 관리자 화면에만 복호화해 표시합니다. 계좌 검증 로그에는 뒷 4자리만 남깁니다.

### 채팅 · 알림

- 구독 중인 멘토-멘티 사이에만 1:1 채팅방을 열 수 있고, 메시지 페이징 조회와 채팅 종료(이력 삭제)를 지원합니다.
- 알림 목록(페이징), 안 읽은 개수, 읽음 처리(단건/전체), 읽은 알림 일괄 삭제를 제공합니다.

### 고객센터 · 관리자

- 1:1 문의는 **비회원도** 등록할 수 있습니다.
- 관리자(`ADMIN`)는 멘토 신청 승인/거절, 회원 검색(키워드·역할·정렬 + 페이징)·차단·강제 탈퇴(소프트 삭제), 환불 승인/거절, 정산 승인, 문의 상태 변경을 처리합니다.

## 기술 스택

| 영역 | 기술 | 선택 이유 |
| --- | --- | --- |
| Backend | Java 17, Spring Boot 4.1.0 | 도메인 중심 계층 분리와 REST API 구현 |
| 인증 | Spring Security, JWT(jjwt 0.12.5), OAuth2 Client | Stateless 인증과 Google·Kakao 소셜 로그인 통합 |
| 데이터 | Spring Data JPA(Hibernate 6), PostgreSQL(Supabase) | 관계형 도메인 모델과 트랜잭션 처리, 관리형 DB로 운영 부담 최소화 |
| 결제 | PortOne V2 Server SDK | 빌링키 기반 정기결제·환불·웹훅을 한 SDK로 처리 |
| 이미지/파일 | Cloudinary 서명 업로드, 로컬 디스크(첨부파일) | 이미지 원본을 서버가 중계하지 않고 클라이언트가 직접 업로드 |
| 메일 | Spring Mail | 회원가입·이메일 변경 인증 코드 발송 |
| 문서 | springdoc-openapi (Swagger) | API 계약 확인·테스트 |
| 모니터링 | Spring Actuator, Micrometer + Prometheus | 헬스체크·지표 수집 |
| Frontend | Next.js 16 (App Router), React 19, CSS Modules | 서버 컴포넌트 기반 라우팅과 도메인별 페이지 분리 |
| 콘텐츠 | react-markdown, remark-gfm, rehype-highlight | 멘토 아티클 마크다운 렌더링·코드 하이라이팅 |
| Infra/CI·CD | Docker Compose, GitHub Actions(self-hosted runner), Nginx, Certbot, Vercel | 백엔드 자동 재배포와 HTTPS 적용 |
| Test | JUnit5, H2 | 서비스 계층 단위 테스트 |

## 아키텍처

```text
Browser ──HTTPS──▶ Vercel (Next.js Frontend)
   │
   └────HTTPS────▶ Nginx (Certbot/TLS)
                     └──▶ Spring Boot API ──▶ PostgreSQL (Supabase)
                                            ├──▶ PortOne     (빌링키/결제/환불/웹훅)
                                            ├──▶ Cloudinary  (이미지)
                                            └──▶ SMTP        (이메일 인증)
```

Backend는 `controller → service → repository`로 계층을 나누고, 요청·응답에는 Entity 대신 DTO를 사용합니다. 인증 주체는 컨트롤러에서 `@AuthenticationPrincipal`로만 받고, 오류 응답은 `GlobalExceptionHandler`에서 `{ code, message, field }` 한 가지 형태로 통일합니다.

## 프로젝트 구조

```text
ProjectTeam_5/
├── backend/                      # Spring Boot 애플리케이션
│   └── src/main/java/com/example/findAnswer/mentorbridge/
│       ├── controller/           # Auth, User, Question, Answer, Mentor, MentorPlan,
│       │                         #   MentorPost, MentorDashboard, Subscription, Payment,
│       │                         #   PaymentMethod, Settlement, Webhook, Chat,
│       │                         #   Notification, Inquiry, Attachment, Admin, Health
│       ├── service/              # 비즈니스 로직
│       ├── repository/           # JPA Repository
│       ├── entity/               # User, Question/Answer/QuestionLike, MentorApplication,
│       │                         #   MentorProfile, MentorPlan, MentorPost(+Like/ViewLog),
│       │                         #   MentorReview, Subscription, Payment/PaymentTransaction/
│       │                         #   PaymentMethod/PaymentCancellation, Settlement(+Account),
│       │                         #   ChatRoom/ChatMessage, Notification, Inquiry, Follow,
│       │                         #   OAuthAccount, RefreshToken, EmailVerification,
│       │                         #   QuestionAttachmentFile, WebhookEvent, BaseTimeEntity
│       ├── dto/                  # 요청/응답 DTO (도메인별 하위 패키지)
│       ├── converter/            # EncryptedStringConverter (AES-256-GCM)
│       ├── jwt/                  # JwtTokenProvider, JwtAuthenticationFilter
│       ├── config/               # SecurityConfig, SwaggerConfig 등
│       ├── handler/              # 전역 예외 처리, OAuth 성공/실패 핸들러
│       ├── webhook/              # PortOne 웹훅 서명 검증
│       ├── scheduler/            # 구독 만료 스케줄러
│       └── constants/            # Role, Provider, ErrorCode, 상태 enum
│
├── frontend/                     # Next.js 애플리케이션
│   └── src/
│       ├── app/                  # App Router 페이지
│       │   ├── (auth)/           # 로그인 · 회원가입
│       │   ├── admin/            # 관리자 (회원/멘토/환불/정산/문의)
│       │   ├── chat/[roomId]/    # 1:1 채팅
│       │   ├── mentors/          # 멘토 목록/상세, 멘토 아티클
│       │   ├── mentor/dashboard/ # 멘토 대시보드
│       │   ├── profile/          # 마이페이지, 요금제·결제수단·구독 관리
│       │   ├── questions/        # 질문 목록/상세/작성/수정, 답변
│       │   └── users/[id]/       # 공개 프로필
│       ├── lib/                  # API 클라이언트 (client.js 공통 + 도메인별)
│       └── constants/            # routes.js, mentorOptions.js, images.js
│
├── docker-compose.yml            # backend + DB + Nginx + Certbot
└── .github/workflows/            # CI/CD 파이프라인
```

## API 개요

Base URL은 `/api`이며, 결제·구독·채팅·알림·문의 등 후반에 추가된 도메인은 `/api/v1`을 사용합니다.

| 도메인 | 대표 엔드포인트 |
| --- | --- |
| Auth | `POST /api/auth/signup · /login · /refresh · /logout` |
| User | `GET·PATCH /api/users/me`, `PATCH /me/public-profile`, `POST /api/users/{id}/follow` |
| Question | `GET·POST /api/questions`, `POST /{id}/like`, `GET /following` |
| Answer | `POST·GET /api/questions/{id}/answers`, `PATCH·DELETE /api/answers/{id}` |
| Mentor | `GET /api/mentors`, `GET·PUT /api/mentors/{mentorId}`, `/{mentorId}/reviews` |
| Mentor Plan | `GET·POST·PUT·DELETE /api/v1/mentors/{mentorId}/plans` |
| Mentor Post | `GET·POST·PUT·DELETE /api/v1/mentors/{mentorId}/posts`, `/{postId}/likes` |
| Dashboard | `GET /api/mentors/me/dashboard/{summary,trend,rating-histogram,...}` |
| Subscription | `POST /api/v1/subscriptions`, `PATCH /{id}/cancel`, `GET /check`, `GET /me` |
| Payment | `POST /api/v1/payments/{id}/complete`, `/{id}/cancellations` |
| Payment Method | `POST /api/payment-methods/prepare`, `POST·GET /api/payment-methods` |
| Settlement | `POST /api/v1/settlements`, `PATCH /api/admin/settlements/{id}/complete` |
| Webhook | `POST /api/v1/webhooks/portone` |
| Chat | `POST /api/v1/mentors/{mentorId}/chat-room`, `/chat-rooms/{roomId}/messages` |
| Notification | `GET /api/v1/notifications`, `/unread-count`, `PATCH /read-all` |
| Inquiry | `POST /api/v1/inquiries` (비회원 가능), `GET·PATCH /api/admin/inquiries` |
| Admin | `/api/admin/mentors/applications`, `/users/search`, `/cancellations`, `/settlements` |

> 전체 명세는 실행 후 **Swagger UI**(`/swagger-ui/index.html`)에서 확인할 수 있습니다.

## 실행 방법

### 요구 사항

- JDK 17, Node.js 20+, Docker(로컬 DB 구동용, 선택)

> ⚠️ `application-dev.yaml`의 DB 기본값은 배포용 Supabase를 가리킵니다. 로컬 실행 시 **반드시 환경변수로 로컬 DB를 오버라이드**해 배포 DB에 직접 붙지 않도록 하세요.

### 1. 로컬 PostgreSQL

```bash
docker run -d --name findanswer-postgres \
  -e POSTGRES_DB=findanswer \
  -e POSTGRES_USER=findanswer \
  -e POSTGRES_PASSWORD=findanswer123 \
  -p 5432:5432 postgres:16
```

`ddl-auto: update` 설정이라 테이블은 애플리케이션 실행 시 자동 생성됩니다.

### 2. Backend

```bash
cd backend
export DB_HOST=localhost DB_PORT=5432 DB_NAME=findanswer
export DB_USERNAME=findanswer DB_PASSWORD=findanswer123
export JWT_SECRET_KEY=local-dev-secret-please-change-me-32chars-min
export SETTLEMENT_ENCRYPTION_KEY=$(openssl rand -base64 32)   # 32바이트 Base64
./gradlew bootRun
```

- 서버: `http://localhost:8080` · Swagger: `/swagger-ui/index.html` · 헬스체크: `/health`
- OAuth·PortOne·Cloudinary·메일 환경변수를 생략해도 서버는 기동되며, 해당 외부 연동 기능만 동작하지 않습니다.
- `SETTLEMENT_ENCRYPTION_KEY`는 정산 계좌 암호화 키라 비어 있으면 **기동에 실패합니다**(암호화 없이 평문 저장되는 사고를 막기 위한 의도된 동작).

### 3. Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev
```

`http://localhost:3000`에서 실행되며, 백엔드 CORS 허용 목록에 포함되어 있어 별도 설정이 필요 없습니다.

### 주요 환경변수

| 변수 | 설명 |
| --- | --- |
| `DB_HOST` · `DB_PORT` · `DB_NAME` · `DB_USERNAME` · `DB_PASSWORD` | 데이터베이스 연결 |
| `JWT_SECRET_KEY` · `JWT_ACCESS_TOKEN_EXPIRATION_MS` · `JWT_REFRESH_TOKEN_EXPIRATION_MS` | JWT 서명 키와 만료(기본 15분 / 14일) |
| `SETTLEMENT_ENCRYPTION_KEY` | 정산 계좌 AES-256-GCM 키 (Base64 32바이트, 필수) |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` | 구글 OAuth |
| `KAKAO_REST_API_KEY` · `KAKAO_CLIENT_SECRET` · `KAKAO_ADMIN_KEY` | 카카오 OAuth |
| `SUCCESS_FRONT_REDIRECT_URI` · `FAILURE_FRONT_REDIRECT_URI` | OAuth 리다이렉트 |
| `PORTONE_STORE_ID` · `PORTONE_API_SECRET` · `PORTONE_WEBHOOK_SECRET` | PortOne 인증·웹훅 검증 |
| `PORTONE_CHANNEL_KEY_PAYMENT` · `PORTONE_CHANNEL_KEY_BILLING` | PortOne 결제/빌링 채널 |
| `CLOUDINARY_URL` · `MAIL_USERNAME` · `MAIL_PASSWORD` · `UPLOAD_DIR` | 이미지·메일·첨부파일 |
| `NEXT_PUBLIC_API_URL` | (Frontend) 백엔드 API 주소 |

## 테스트

```bash
cd backend
./gradlew test
```

| 검증 영역 | 대표 시나리오 |
| --- | --- |
| 인증·인가 | 토큰 만료·위조, 비로그인 요청 차단, 비밀번호 불일치 |
| 질문·답변 | 작성자 외 수정/삭제 거부, 없는 질문 조회 |
| 멘토 아티클 | 비구독자 유료 글 잠금, 멘토 본인 외 작성/수정 차단 |
| 구독·결제 | 결제 재조회 검증 실패, 웹훅 중복 이벤트 무시 |
| 정산 | `REQUESTED`가 아닌 정산의 완료 처리 거부 |

Frontend 자동화 테스트는 미구축이며, 대신 `@babel/parser` 기반 구문 검사와 수동 시나리오 점검으로 회귀를 확인했습니다.

## 주요 기술 의사결정

### 인증 주체를 `X-USER-ID` 헤더가 아닌 `@AuthenticationPrincipal`로 통일

- 상황: 초기 구현에서 일부 컨트롤러가 사용자 식별을 클라이언트가 보낸 `X-USER-ID` 헤더로 받고 있었습니다. 헤더 값은 누구나 바꿔 보낼 수 있어, 로그인만 되어 있으면 남의 ID를 적어 타인의 아티클을 수정·삭제할 수 있는 상태였습니다.
- 결정: 인증된 주체는 오직 Security Context에서만 얻도록 모든 컨트롤러를 `@AuthenticationPrincipal`로 바꾸고, "본인인지" 검사는 `requireSelf()`·`requireLogin()` 헬퍼로 한 곳에 모았습니다. 권한 실패는 400이 아니라 **403**으로 내려 클라이언트가 입력 오류와 구분할 수 있게 했습니다.
- 결과·한계: 신뢰 경계가 필터 한 곳으로 좁아졌습니다. 다만 관리자 권한은 `SecurityConfig`의 URL 패턴과 컨트롤러의 `@PreAuthorize` **양쪽**에 남겨 이중 방어로 두었습니다 — 한쪽 설정을 실수로 지워도 다른 쪽이 막습니다.

### 결제 확정을 PG 즉시 응답이 아닌 "서버 재조회"로 판정

- 상황: 결제창/빌링키 청구의 즉시 응답은 클라이언트를 거치므로 그대로 신뢰하면 금액·상태 위조 가능성이 있습니다.
- 결정: 응답과 별개로 서버가 PortOne에 결제를 재조회해 상태·금액을 대조한 뒤에만 구독을 활성화하고, 웹훅은 서명을 **원문 바디 기준으로** 검증한 다음 `WebhookEvent` 유니크 제약으로 중복 수신을 무시합니다.
- 결과·한계: 클라이언트 위조와 웹훅 중복 도달을 모두 차단했습니다. 다만 결제 실패를 예외로 던지는 경로가 남아 있어, 실패 이력을 기록하는 트랜잭션까지 함께 롤백되는 구간이 있습니다(개선 계획 참고).

### Access Token을 localStorage가 아닌 메모리에 보관

- 상황: Access Token을 localStorage에 두면 XSS 한 번에 토큰이 그대로 유출되고, 새로고침마다 남아 있는 만료 토큰으로 첫 요청이 실패하는 문제도 있었습니다.
- 결정: Access Token은 모듈 스코프 변수(`tokenStore.js`)에만 두고, 새로고침 시에는 `HttpOnly` Refresh 쿠키로 세션을 복원합니다. Refresh Token은 DB에 해시로 저장하고 재발급 때마다 회전시킵니다.
- 결과·한계: 스크립트로 토큰을 읽어갈 수 없고, 탈취된 Refresh Token은 다음 회전에서 무효화됩니다. 대신 탭마다 첫 진입에 재발급 요청이 한 번 더 발생합니다.

### 공개 프로필과 멘토 프로필을 분리

- 상황: 처음에는 `PATCH /users/me/public-profile` 하나가 `users`와 `mentor_profiles`를 동시에 건드렸습니다. 그래서 일반·관리자 계정은 "잘못된 요청"으로 실패하고, 멘토 계정은 저장에 성공한 것처럼 보이지만 새로고침하면 값이 사라지는 증상이 있었습니다.
- 결정: 두 개념을 테이블 단위로 갈랐습니다. 공개 프로필(`bio`·`introduction`·`careers`·`interests`·`location`)은 **모든 사용자**의 `users` 행에만 쓰고, 멘토 전용 정보(전문 분야 태그·요금제 노출 등)는 `mentor_profiles`에서 별도 화면으로 관리합니다.
- 결과·한계: 역할과 무관하게 같은 API가 동작하고, 저장 후 다시 조회해도 값이 유지됩니다. 이미 양쪽에 나뉘어 들어간 기존 데이터는 이관이 필요합니다.

### 멘토 분류 체계를 프론트엔드 단일 상수로 고정

- 상황: 멘토 피드의 카테고리 필터와 멘토 프로필 편집 폼이 각자 선택지 배열을 들고 있었습니다. 한쪽에만 항목이 추가되자 "저장은 되는데 필터에 안 잡히는" 상태가 됐고, 실제로 필터가 전혀 동작하지 않았습니다.
- 결정: `constants/mentorOptions.js`를 단일 출처로 만들어 카테고리 목록·경력 구간·정규화 함수(`normalizeCategories`, `careerCodeOf`)를 공유하고, 편집 폼은 자유 입력 대신 **체크박스 다중 선택 + 경력 드롭다운**으로 바꿔 애초에 목록 밖 값이 저장될 수 없게 했습니다.
- 결과·한계: 두 화면이 구조적으로 어긋날 수 없습니다. 다만 정규화는 프론트엔드 책임이라, 백엔드는 여전히 임의 문자열을 받아들입니다.

### 정산 계좌번호를 컬럼 단위로 암호화하고 점진 마이그레이션

- 상황: 정산 계좌번호가 평문으로 저장되고 검증 로그에도 그대로 찍히고 있었습니다. 이미 저장된 행이 있어 스키마를 한 번에 바꾸기도 어려웠습니다.
- 결정: JPA `AttributeConverter`(`EncryptedStringConverter`)로 AES-256-GCM 암호화를 적용하고, 암호문에 `enc:v1:` 접두사를 붙였습니다. 읽을 때 접두사가 없으면 평문으로 간주해 그대로 반환하므로 **기존 행을 건드리지 않고도** 새로 저장되는 값부터 암호화됩니다. 로그는 뒷 4자리만 남기도록 마스킹했습니다.
- 결과·한계: 무중단으로 암호화를 도입했고, 키가 비면 애플리케이션이 아예 뜨지 않아 "설정을 깜빡해 평문 저장"이 불가능합니다. 다만 예금주명은 아직 평문이고, 기존 평문 행을 채우는 일괄 마이그레이션은 남아 있습니다.

### 정산 상태 전이를 서비스가 아닌 엔티티가 지키게 함

- 상황: 관리자 화면에서 정산 완료를 두 번 누르면 이미 완료된 건이 다시 완료 처리됐습니다. 검증이 서비스 계층에만 있어, 다른 경로로 호출하면 그대로 통과했습니다.
- 결정: `Settlement.complete()`가 현재 상태를 확인해 `REQUESTED`가 아니면 예외를 던지도록 상태 기계를 **엔티티 안으로** 옮기고, 서비스는 그 위에서 권한만 검사합니다.
- 결과·한계: 어떤 경로로 호출해도 잘못된 전이가 막힙니다. 다만 동시 요청에 대한 비관적 락은 아직 없어, 완전한 직렬화는 개선 과제로 남았습니다.

### 오류 응답을 `{ code, message, field }` 한 가지 형태로 통일

- 상황: 예외 종류마다 응답 형태가 달라, 프론트엔드 공통 클라이언트가 서버 메시지를 못 읽고 "로그인이 필요한 서비스입니다"로 덮어쓰는 일이 있었습니다. 비밀번호가 틀려도 로그인 오류로 보이는 식이었습니다.
- 결정: `GlobalExceptionHandler`가 모든 예외를 `ErrorResponse{code, message, field}`로 변환하고, 프론트엔드는 **서버 메시지가 있으면 절대 덮어쓰지 않고** 없을 때만 상태 코드별 기본 문구를 씁니다.
- 결과·한계: `PASSWORD_MISMATCH`처럼 상황에 맞는 메시지가 사용자에게 그대로 전달됩니다. 다만 기존 화면에 흩어진 하드코딩 문구를 모두 걷어내는 작업은 진행 중입니다.

## Troubleshooting

### Hibernate enum CHECK 제약이 `ddl-auto: update`로 갱신되지 않던 문제

- 문제: 정산에 `REQUESTED` 상태를 추가한 뒤 출금 신청을 하면 `settlements_status_check` 제약 위반으로 INSERT가 실패했습니다. 로컬 코드에는 분명히 존재하는 값이었습니다.
- 조사: Hibernate가 `@Enumerated(STRING)` 컬럼에 대해 값 목록을 CHECK 제약으로 생성하는데, `ddl-auto: update`는 **컬럼 추가만 할 뿐 기존 제약을 ALTER하지 않는다**는 점을 확인했습니다. 즉 제약에는 enum을 추가하기 전 값들만 남아 있었습니다.
- 해결·검증: 제약을 DROP하고 현재 enum 값 전체로 다시 CREATE했습니다. 이후 출금 신청 → 관리자 완료 흐름이 정상 동작하는 것을 확인했고, 이후 enum을 늘릴 때는 스키마 변경을 함께 반영해야 한다는 것을 팀 규칙으로 남겼습니다.

### `questions_pkey` 중복 키로 질문 등록이 실패

- 문제: 질문을 등록하면 `duplicate key value violates unique constraint "questions_pkey"` 오류가 났습니다. 특정 id(25)에서 반복적으로 발생했습니다.
- 조사: PostgreSQL identity 컬럼은 시퀀스에서 다음 값을 받는데, 초기 데이터 투입 때 **id를 명시해 INSERT**한 이력이 있어 시퀀스가 `MAX(id)`보다 뒤처져 있었습니다. 애플리케이션 버그가 아니라 데이터 투입 방식의 부작용이었습니다.
- 해결·검증: `setval(pg_get_serial_sequence('questions','id'), COALESCE(MAX(id),0), true)`로 시퀀스를 실제 최대값에 맞추고, 같은 문제가 있을 다른 테이블까지 한 번에 보정하는 `DO` 블록을 실행했습니다. 이후 연속 등록에서 재현되지 않았습니다.

### 동시 401 요청이 Refresh Token 회전과 충돌해 로그아웃되던 문제

- 문제: 페이지 진입 시 여러 API를 병렬 호출하는데, Access Token이 만료돼 있으면 여러 요청이 동시에 재발급을 시도했습니다. Refresh Token은 회전 방식이라 첫 요청이 성공하는 순간 나머지가 들고 있던 토큰이 무효가 되어 강제 로그아웃됐습니다.
- 조사: 공통 클라이언트가 401마다 독립적으로 재발급을 호출하는 구조였고, 재시도 요청이 헤더를 병합하는 순서 때문에 **방금 갱신한 토큰 대신 만료된 토큰**을 다시 붙이는 경로도 함께 발견했습니다.
- 해결·검증: 재발급을 single-flight로 묶어 진행 중인 요청이 있으면 그 Promise를 공유하게 하고, 헤더 병합 순서를 고쳐 새 토큰이 항상 마지막에 적용되도록 했습니다. 토큰 만료 직후 여러 탭·여러 요청을 동시에 발생시켜 로그아웃이 재현되지 않는 것을 확인했습니다.

### `export { a as b } from`이 로컬 바인딩을 만들지 않아 발생한 런타임 오류

- 문제: 관리자 회원 검색에서 `ReferenceError: getToken is not defined`가 발생했습니다. 파일 안에 분명히 `getToken`을 export하는 줄이 있었습니다.
- 조사: 문제의 줄은 `export { getAccessToken as getToken } from "./tokenStore"` 형태의 **재수출**이었습니다. 재수출은 모듈 외부로 이름만 내보낼 뿐 그 파일 안에 지역 바인딩을 만들지 않으므로, 같은 파일의 다른 함수에서 참조할 수 없습니다.
- 해결·검증: `import { getAccessToken }` 후 `export const getToken = () => getAccessToken();`로 바꿔 실제 바인딩을 만들고, `lib/` 전체에서 같은 패턴이 더 없는지 훑어 확인했습니다.

### 머지 이후 관리자 페이지가 통째로 렌더링되지 않던 문제

- 문제: 브랜치 병합 후 `admin/page.jsx`에서 `Expected '}', got '<eof>'` 빌드 오류가 났고, 급히 괄호를 맞추자 이번엔 오류 없이 빈 화면이 떴습니다. 정산 관리 탭도 사라졌습니다.
- 조사: 병합 과정에서 한 핸들러의 닫는 `};`가 유실됐고, 이를 임시로 끝에 `}`를 더해 막으면서 **`AdminPage` 함수 밖으로 JSX가 밀려나** 최상위 `return`이 없는 컴포넌트가 되어 있었습니다. 눈으로는 구분이 어려운 형태였습니다.
- 해결·검증: 유실된 `};`를 원위치에 복원하고 덧붙은 `}`를 제거한 뒤, `@babel/parser`로 AST를 떠서 `AdminPage`가 최상위 `ReturnStatement`를 갖는지 기계적으로 검증했습니다. 사라졌던 탭과 환불 관리 블록도 함께 복구했습니다.

### 관리자 정산 표에서 긴 값이 겹쳐 보이던 문제

- 문제: 정산 목록에 계좌 컬럼을 추가하자 계좌번호가 길어질 때 옆 컬럼 글자와 겹쳐 보였습니다.
- 조사: 표에 `table-layout: fixed`가 걸려 있었는데, 새 셀에는 `min-width`만 지정했습니다. `fixed` 레이아웃에서는 첫 행의 셀 너비가 컬럼 폭을 결정하고 `min-width`는 무시되므로, 내용이 폭을 넘어가면 그대로 삐져나옵니다.
- 해결·검증: `<th>`에 명시적 `width`를 주고, 표를 가로 스크롤 컨테이너로 감싼 뒤 셀에 `overflow-wrap: anywhere`를 적용했습니다. 긴 계좌번호·긴 이름 조합으로 겹침이 사라진 것을 확인했습니다.

## 팀과 기여

멋쟁이사자처럼 백엔드 24기 — 5팀 (FindAnswer)

| 이름 | 역할 | 담당 도메인 |
| --- | --- | --- |
| 김선우 | 팀장 | <!-- TODO --> |
| 이상민 | 부팀장 | <!-- TODO --> |
| 박준성 | 팀원 | <!-- TODO --> |
| 이동건 | 팀원 | <!-- TODO --> |

- **결제·구독(PortOne)** 은 팀 공통 과제로 진행했습니다.
- 프론트엔드는 공통 플랫폼(공통 API 클라이언트·레이아웃·인증 컨텍스트)을 나눠 맡고, 각 도메인 화면은 백엔드 담당자가 함께 작업했습니다.
- 병합 이후에는 전체 코드 진단을 두 차례 수행해 인증·결제·권한 관련 문제를 정리했습니다.

## 개선 계획

- 결제 실패 기록이 예외 롤백에 함께 지워지지 않도록 **실패 처리를 별도 트랜잭션으로 분리**
- 웹훅 멱등 처리에서 중복 이벤트가 롤백 루프를 유발하는 경로 정리
- 구독 상태 전이 `switch`의 미처리 분기(`else`) 보강과 **중복 청구 방지 구간** 정리
- 멘토 목록·질문 목록의 **N+1 제거**(`answerCount`, 멘토 1+2N, 대시보드 집계)
- 외부 API 호출(`RestClient`)에 **연결·읽기 타임아웃** 설정
- 정산 완료에 **비관적 락** 적용, 예금주명 암호화, 기존 평문 계좌 일괄 마이그레이션
- 수수료 표기 불일치(화면 10% vs 계산 13%) 정정
- 관리자 페이지를 탭 단위 컴포넌트로 분리하고, 프론트엔드 테스트 도입
