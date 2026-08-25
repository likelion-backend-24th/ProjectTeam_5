# FindAnswer (MentorBridge)

> 멘토와 멘티를 잇는 유료 구독형 Q&A 멘토링 플랫폼 — 궁금한 것을 질문하고 전문가(멘토)에게 답변받고, 마음에 드는 멘토는 요금제를 구독해 1:1 채팅·전용 아티클까지 이용할 수 있는 지식 공유 서비스

멋쟁이사자처럼 백엔드 24기 5팀 포트폴리오 프로젝트입니다. 사용자는 카테고리별로 질문을 등록하고, 승인된 멘토들이 답변(및 대댓글)을 달아줍니다. 더 나아가 멘토는 요금제(플랜)를 만들어 판매하고, 멘티는 PortOne 결제로 구독해 멘토 전용 아티클과 1:1 채팅을 이용할 수 있는 커뮤니티형 멘토링 플랫폼입니다.

---

## 📌 주요 기능

### 인증 / 계정
- **일반 회원가입 / 로그인** — 이메일 + 비밀번호 (BCrypt 암호화)
- **소셜 로그인(OAuth2)** — Google, Kakao
- **JWT 인증** — Access Token(15분) + Refresh Token(14일, HttpOnly 쿠키)
- Refresh Token은 해시값으로 저장하여 보안 강화
- 프로필(이름·관심분야·소개·프로필 이미지) 수정, 이메일 변경(인증코드 확인 포함), 비밀번호 변경, 회원 탈퇴(OAuth 연결 해제 포함)
- 이메일 인증(코드 발송 / 검증)
- 사용자 팔로우 / 언팔로우, 공개 프로필 조회

### 질문(Question) & 답변(Answer)
- 질문 작성 / 수정 / 삭제 (작성자 본인만), 카테고리별 목록 조회 · 키워드 검색 · 페이징(기본 10개)
- 질문 좋아요 토글
- 팔로우한 유저의 질문 피드 조회
- 특정 유저가 작성한 질문 / 답변한 질문 목록 조회
- 답변 작성 / 수정 / 삭제, **대댓글(답변의 답변)** 지원 (부모-자식 계층 구조)
- 질문 첨부파일 업로드 · 다운로드

### 멘토(Mentor)
- 일반 사용자의 멘토 신청 및 신청 상태 조회 → 관리자 승인 시 `USER` → `MENTOR` 승격
- 멘토 목록 검색(이름/소개/태그) · 상세 조회 · 프로필 수정
- **멘토 리뷰**: 구독 이력이 있는 유저만 작성 가능, 본인 리뷰 수정/삭제
- **멘토 아티클(Post)**: 마크다운 글 작성/수정/삭제, 좋아요, 조회 기록
- **멘토 대시보드**: 요약 지표, 기간별 트렌드, 평점 히스토그램, 프로필 완성도, 최근 글/리뷰, 구독자 목록, 결제 내역, 대기 중인 환불 요청

### 요금제 · 구독 · 결제 (PortOne 연동)
- 멘토가 **요금제(Plan)** 를 등록/수정/삭제
- 멘티는 등록된 결제수단(빌링키)으로 요금제를 **구독**하면 서버가 즉시 청구 (결제창 팝업 없이 처리)
- 구독 해지 예약, 멘토별 구독 권한(접근 가능 여부) 검증, 내 구독 목록/결제 이력 조회
- **결제수단 관리**: PortOne 빌링키 발급 준비 → 등록 → 기본 결제수단 지정 → 삭제
- **환불**: 멘티의 환불 요청 → 관리자 승인 시 PortOne 취소 API 실호출로 실제 환불 처리
- **PortOne 웹훅** 수신 및 서명 검증으로 결제 상태 동기화

### 채팅 & 알림
- 구독 중인 멘토-멘티 간 1:1 채팅방 생성/조회, 메시지 전송 및 페이징 조회, 채팅 종료(대화 이력 삭제)
- 알림 목록 조회(페이징), 안 읽은 개수, 읽음 처리(단건/전체), 삭제(읽은 알림 일괄/단건)

### 고객센터 / 관리자
- 비회원도 이용 가능한 **1:1 문의** 등록
- 관리자(ADMIN) 전용:
  - 멘토 신청 목록 조회 / 승인 / 거절
  - 회원 검색(키워드·역할 필터·정렬) + 페이지네이션, 전체 회원 목록, 회원 차단/차단 해제, 강제 탈퇴(소프트 삭제)
  - 대기 중인 환불 요청 조회 / 승인 / 거절
  - 문의 목록 조회 / 상태 변경

### 운영
- Actuator + Prometheus 기반 헬스체크 / 모니터링
- Swagger(OpenAPI) 기반 API 문서 자동화
- Cloudinary 서명 업로드(이미지), 로컬 디스크 저장(일반 첨부파일)

---

## 🛠 기술 스택

### Backend
| 구분 | 기술 |
|------|------|
| Language | Java 17 |
| Framework | Spring Boot 4.1.0 |
| Persistence | Spring Data JPA (Hibernate) |
| Security | Spring Security, OAuth2 Client, JWT (jjwt 0.12.5) |
| Database | PostgreSQL (운영/개발, Supabase), MySQL 8.4 (Docker), H2 (테스트) |
| 결제 | PortOne 서버 SDK (`io.portone:server-sdk`) — 빌링키/결제/환불/웹훅 |
| 파일/이미지 | Cloudinary (서명 업로드), 로컬 디스크 업로드(첨부파일) |
| 메일 | Spring Mail (이메일 인증 코드 발송) |
| Docs | springdoc-openapi (Swagger UI) |
| Monitoring | Spring Actuator, Micrometer + Prometheus |
| Build | Gradle |

### Frontend
| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Library | React 19 |
| Styling | Tailwind CSS 4, CSS Modules |
| 결제 | `@portone/browser-sdk` |
| 콘텐츠 렌더링 | `react-markdown`, `remark-gfm`, `remark-breaks`, `rehype-highlight`, `highlight.js` (멘토 아티클 마크다운) |
| Icons | react-icons |

### Infra / DevOps
- Docker / Docker Compose (backend + MySQL + Nginx + Certbot)
- Nginx 리버스 프록시, Let's Encrypt(Certbot) HTTPS
- GitHub Actions CI/CD — `main` 브랜치의 `backend/**` 변경 시 self-hosted 러너가 자동으로 `docker compose up -d --build backend` 재배포 (`backend-ci-workflow`, `backend-deploy-workflow`)
- 배포: Vercel(Frontend), Supabase PostgreSQL(DB)

---

## 📂 프로젝트 구조

```
ProjectTeam_5/
├── backend/                      # Spring Boot 애플리케이션
│   └── src/main/java/com/example/findAnswer/
│       ├── FindAnswerApplication.java
│       └── mentorbridge/
│           ├── controller/       # Auth, User, Question, Answer, Mentor, MentorPlan,
│           │                     #   MentorPost, MentorDashboard, Subscription, Payment,
│           │                     #   PaymentMethod, Webhook, Chat, Notification, Inquiry,
│           │                     #   Attachment, Admin, Health
│           ├── service/          # 비즈니스 로직
│           ├── repository/       # JPA Repository
│           ├── entity/           # User, Question/Answer/QuestionLike, MentorApplication,
│           │                     #   MentorProfile, MentorPlan, MentorPost(+Like/ViewLog),
│           │                     #   MentorReview, Subscription, Payment/PaymentTransaction/
│           │                     #   PaymentMethod/PaymentCancellation, BillingKeyIssuanceIntent,
│           │                     #   ChatRoom/ChatMessage, Notification, Inquiry, Follow,
│           │                     #   OAuthAccount, RefreshToken, EmailVerification,
│           │                     #   QuestionAttachmentFile, WebhookEvent, BaseTimeEntity
│           ├── dto/              # 요청/응답 DTO (도메인별 하위 패키지)
│           ├── jwt/              # JwtTokenProvider, JwtAuthenticationFilter
│           ├── config/           # SecurityConfig, SwaggerConfig 등
│           ├── handler/          # 전역 예외 처리, OAuth 성공/실패 핸들러
│           ├── webhook/          # PortOne 웹훅 서명 검증
│           ├── constants/        # Role, Provider, ErrorCode, 상태 enum
│           └── ...               # exception, factory, listener, client
│
├── frontend/                     # Next.js 애플리케이션
│   └── src/
│       ├── app/                  # App Router 페이지
│       │   ├── (auth)/           # 로그인 · 회원가입
│       │   ├── admin/            # 관리자 페이지 (회원/멘토/환불/문의 관리)
│       │   ├── chat/[roomId]/    # 1:1 채팅
│       │   ├── mentors/          # 멘토 목록/상세, 멘토 아티클
│       │   ├── mentor/dashboard/ # 멘토 대시보드
│       │   ├── profile/          # 마이페이지, 요금제 관리, 결제수단, 구독 관리
│       │   ├── questions/        # 질문 목록/상세/작성/수정, 답변
│       │   ├── users/[id]/       # 공개 프로필
│       │   ├── oauth/            # 소셜 로그인 콜백
│       │   └── contexts/         # AuthContext
│       ├── components/           # Header, Icons
│       ├── lib/                  # API 클라이언트 (auth, questions, users, mentors,
│       │                         #   mentorPlans, mentorPosts, mentorDashboard,
│       │                         #   subscriptions, payments, chat, notifications,
│       │                         #   attachments, admin, ...)
│       └── constants/            # 라우트 상수
│
├── docker-compose.yml            # backend + MySQL + Nginx + Certbot
├── compose.dev.yaml / compose.prod.yaml
└── .github/workflows/            # CI/CD 파이프라인
```

---

## 🗂 데이터 모델 (핵심 엔티티)

| 엔티티 | 설명 |
|--------|------|
| **User** | 사용자 (email, password, name, interests, role, 소개/프로필 이미지) |
| **Follow** | 사용자 간 팔로우 관계 |
| **Question** / **Answer** / **QuestionLike** | 질문, 답변(대댓글 self-reference), 질문 좋아요 |
| **QuestionAttachmentFile** | 질문 첨부파일 |
| **MentorApplication** | 멘토 신청 (status: PENDING/APPROVED/REJECTED) |
| **MentorProfile** | 멘토 공개 프로필(소개, 태그 등) |
| **MentorPlan** | 멘토가 판매하는 구독 요금제 |
| **MentorPost** / **MentorPostLike** / **MentorPostViewLog** | 멘토 전용 아티클, 좋아요, 조회 기록 |
| **MentorReview** | 구독 이력이 있는 멘티가 남기는 멘토 리뷰 |
| **Subscription** | 멘티-멘토 구독 관계 (요금제, 상태, 해지 예약) |
| **PaymentMethod** / **BillingKeyIssuanceIntent** | 등록된 결제수단(PortOne 빌링키), 빌링키 발급 시도 |
| **Payment** / **PaymentTransaction** | 결제 건 및 거래 이력 |
| **PaymentCancellation** | 환불 요청 및 처리 상태 |
| **WebhookEvent** | 수신한 PortOne 웹훅 이벤트(중복 처리 방지) |
| **ChatRoom** / **ChatMessage** | 멘토-멘티 1:1 채팅방과 메시지 |
| **Notification** | 사용자 알림 |
| **Inquiry** | 1:1 문의 (비회원 가능) |
| **OAuthAccount** | 소셜 계정 연동 정보 |
| **RefreshToken** | Refresh Token 저장 (해시값) |
| **EmailVerification** | 이메일 인증 코드 |
| **BaseTimeEntity** | 생성/수정 시각 공통 필드 (상속용) |

**Role**: `USER`(일반) · `MENTOR`(전문가) · `ADMIN`(관리자)

---

## 🔌 API 개요

Base URL: `/api` (일부 결제/채팅/알림/문의 도메인은 `/api/v1`)

### Auth (`/api/auth`)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/signup` | 회원가입 | ✕ |
| POST | `/login` | 로그인 (AccessToken 반환 + RefreshToken 쿠키) | ✕ |
| POST | `/refresh` | Access Token 재발급 | 쿠키 |
| POST | `/logout` | 로그아웃 | 쿠키 |

### User (`/api/users`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/me` | 내 프로필 조회 |
| GET | `/` | 전체 회원 목록(공개, 탈퇴 계정 제외) |
| GET | `/{userId}` | 특정 유저 공개 프로필 조회 |
| PATCH | `/me` · `/me/public-profile` · `/me/profile-image` | 프로필 / 공개 프로필 / 프로필 이미지 수정 |
| PATCH | `/me/email` · `/me/password` | 이메일 / 비밀번호 수정 |
| POST | `/me/email/verification-code` · `/me/email/verify` | 이메일 인증코드 발송 / 검증 |
| DELETE | `/me` | 회원 탈퇴 |
| POST | `/{userId}/follow` | 팔로우/언팔로우 토글 |
| POST | `/me/mentor/application` · GET | 멘토 신청 / 내 신청 상태 조회 |

### Question (`/api/questions`)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/` | 목록 조회 / 검색 (`keyword`, `category`, 페이징) | ✕ |
| GET | `/{questionId}` | 상세 조회 | ✕ |
| GET | `/user/{userId}` · `/user/{userId}/answered` | 특정 유저의 작성/답변 질문 목록 | ✕ |
| GET | `/following` | 팔로우한 유저의 질문 피드 | ○ |
| POST | `/` | 질문 작성 | ○ |
| POST | `/{questionId}/like` | 좋아요 토글 | ○ |
| PATCH | `/{questionId}` | 질문 수정 | ○ (작성자) |
| DELETE | `/{questionId}` | 질문 삭제 | ○ (작성자) |

### Answer
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST / GET | `/api/questions/{questionId}/answers` | 답변 작성 / 목록 조회 |
| PATCH / DELETE | `/api/answers/{answerId}` | 답변 수정 / 삭제 |

### Mentor (`/api/mentors`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/` | 멘토 목록 검색(키워드, 페이징) |
| GET / PUT | `/{mentorId}` | 상세 조회 / 프로필 수정(본인) |
| GET / POST / DELETE | `/{mentorId}/reviews[/{reviewId}]` | 리뷰 조회 / 작성·수정 / 삭제 |

### Mentor Plan (`/api/v1/mentors/{mentorId}/plans`) — 멘토 본인만 등록/수정/삭제
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/` · `/{planId}` | 요금제 목록 / 단건 조회 |
| POST / PUT / DELETE | `/` · `/{planId}` | 요금제 등록 / 수정 / 삭제(비활성화) |

### Mentor Post — 멘토 아티클 (`/api/v1/mentors/{mentorId}/posts`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/` · `/{postId}` | 목록 / 상세 조회 |
| POST / PUT / DELETE | `/` · `/{postId}` | 작성 / 수정 / 삭제(멘토 본인만) |
| POST / DELETE | `/{postId}/likes` | 좋아요 / 좋아요 취소 |

### Mentor Dashboard (`/api/mentors/me/dashboard`) — 로그인한 멘토 본인 데이터
`/summary`, `/trend`, `/rating-histogram`, `/profile-completeness`, `/recent-posts`, `/recent-reviews`, `/subscribers`, `/refunds`, `/payments` (모두 GET)

### Subscription (`/api/v1/subscriptions`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/?planid={id}` | 구독 신청 (등록 카드로 즉시 청구) |
| PATCH | `/{subscriptionId}/cancel` | 구독 해지 예약 |
| GET | `/check?mentorId={id}` | 구독 권한(접근 가능 여부) 검증 |
| GET | `/me` | 내 구독 목록 |
| GET | `/{subscriptionId}/payments` | 구독별 결제 이력 |

### Payment / Payment Method (`/api/v1/payments`, `/api/payment-methods`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/payments/{paymentId}/complete` | 결제창 완료 후 서버가 PortOne 재조회하여 확정 |
| POST / GET | `/api/v1/payments/{paymentId}/cancellations` · `/cancellations/me` | 환불 요청 / 내 환불 이력 |
| POST | `/api/payment-methods/prepare` | 빌링키 발급 준비 |
| POST / GET | `/api/payment-methods` | 결제수단 등록 / 목록 조회 |
| PATCH / DELETE | `/api/payment-methods/{id}/default` · `/{id}` | 기본 결제수단 지정 / 삭제 |

### Webhook (`/api/v1/webhooks`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/portone` | PortOne 웹훅 수신 (서명 검증, 중복 이벤트 무시) |

### Chat (`/api/v1`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/mentors/{mentorId}/chat-room` | 채팅방 생성/조회 (구독 중인 멘토만) |
| GET | `/chat-rooms/me` | 내 채팅방 목록 |
| POST / GET | `/chat-rooms/{roomId}/messages` | 메시지 전송 / 목록(페이징) |
| DELETE | `/chat-rooms/{roomId}` | 채팅 종료(이력 삭제) |

### Notification (`/api/v1/notifications`)
GET `/`(페이징), GET `/unread-count`, PATCH `/{id}/read`, PATCH `/read-all`, DELETE `/read`, DELETE `/{id}`

### Attachment (`/api/attachments`)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/images/signature` · `/profile-image/signature` | Cloudinary 서명 업로드 URL 발급 |
| POST | `/files` (multipart) | 일반 파일 업로드(서버 디스크 저장) |
| GET | `/files/{attachId}/download` | 파일 다운로드 |

### Inquiry (`/api/v1/inquiries`, `/api/admin/inquiries`)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/v1/inquiries` | 문의 등록 | ✕ |
| GET | `/api/admin/inquiries` | 문의 목록 조회 | ADMIN |
| PATCH | `/api/admin/inquiries/{id}/status` | 문의 상태 변경 | ADMIN |

### Admin (`/api/admin`) — `ADMIN` 권한 전용
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/mentors/applications` | 멘토 신청 목록 조회 |
| PATCH | `/mentors/{userId}/approval` · `/rejection` | 멘토 승인 / 거절 |
| GET | `/users` | 전체 회원 목록 (페이징 없음) |
| GET | `/users/search` | 회원 검색(키워드/역할/정렬) + 페이지네이션 |
| PATCH | `/users/{userId}/block` · `/unblock` | 회원 차단 / 차단 해제 |
| DELETE | `/users/{userId}` | 회원 강제 탈퇴(소프트 삭제) |
| GET | `/cancellations` | 대기 중인 환불 요청 목록 |
| PATCH | `/cancellations/{id}/approve` · `/reject` | 환불 승인(PortOne 취소 실행) / 거절 |

### 소셜 로그인
- `GET /oauth2/authorization/{provider}` — `provider`: `google`, `kakao`
- 성공 시 프론트엔드 콜백(`/oauth/callback`)으로 리다이렉트

> 전체 API 명세는 애플리케이션 실행 후 **Swagger UI** (`/swagger-ui/index.html`)에서 확인할 수 있습니다.

---

## ⚙️ 로컬 실행 방법 (Getting Started)

### 사전 준비
- **Java 17**
- **Node.js** (Next.js 16 지원 버전)
- **Docker & Docker Compose** (로컬 DB 구동용 · 선택)
- **PostgreSQL** 로컬 인스턴스 (또는 아래 Docker 방식)

> ⚠️ **중요 — 로컬 DB 설정 필수**
> `backend/src/main/resources/application-dev.yaml`의 DB 기본값은 **배포 서버(Supabase PostgreSQL)** 를 가리키고 있습니다.
> 로컬에서 실행할 때는 아래처럼 **환경변수로 로컬 DB 정보를 오버라이드**해서 배포 DB에 직접 연결되지 않도록 해야 합니다.
> (dev 프로필은 PostgreSQL 드라이버를 사용하므로, 로컬 DB도 **PostgreSQL**로 준비하는 것을 권장합니다.)

---

### 1. 로컬 데이터베이스 준비 (PostgreSQL)

Docker로 로컬 PostgreSQL을 간단히 띄울 수 있습니다.

```bash
docker run -d --name findanswer-postgres \
  -e POSTGRES_DB=findanswer \
  -e POSTGRES_USER=findanswer \
  -e POSTGRES_PASSWORD=findanswer123 \
  -p 5432:5432 \
  postgres:16
```

> 이미 로컬에 PostgreSQL이 설치되어 있다면 `findanswer` 데이터베이스만 생성해 두면 됩니다.
> `ddl-auto: update` 설정이라 테이블은 애플리케이션 실행 시 자동 생성됩니다.

---

### 2. Backend 실행

**환경변수로 로컬 DB를 지정**한 뒤 실행합니다. (지정하지 않으면 배포 DB에 붙으니 주의)

**macOS / Linux (bash)**
```bash
cd backend

export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=findanswer
export DB_USERNAME=findanswer
export DB_PASSWORD=findanswer123
export JWT_SECRET_KEY=local-dev-secret-please-change-me-32chars-min

# OAuth / 결제(PortOne) / 이미지(Cloudinary) / 메일 발송을 테스트하지 않는다면 아래는 생략 가능
# (해당 기능 관련 요청만 실패하고 서버 자체는 정상 기동됩니다)
# export GOOGLE_CLIENT_ID=...   export GOOGLE_CLIENT_SECRET=...
# export KAKAO_REST_API_KEY=... export KAKAO_CLIENT_SECRET=... export KAKAO_ADMIN_KEY=...
# export PORTONE_STORE_ID=...   export PORTONE_API_SECRET=...  export PORTONE_WEBHOOK_SECRET=...
# export PORTONE_CHANNEL_KEY_PAYMENT=...  export PORTONE_CHANNEL_KEY_BILLING=...
# export CLOUDINARY_URL=...
# export MAIL_USERNAME=...      export MAIL_PASSWORD=...

./gradlew bootRun
```

**Windows (PowerShell)**
```powershell
cd backend

$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="findanswer"
$env:DB_USERNAME="findanswer"
$env:DB_PASSWORD="findanswer123"
$env:JWT_SECRET_KEY="local-dev-secret-please-change-me-32chars-min"

./gradlew bootRun
```

- 기본 프로필은 `dev`이며, 서버는 **`http://localhost:8080`** 에서 실행됩니다.
- API 문서: **`http://localhost:8080/swagger-ui/index.html`**
- 헬스체크: **`http://localhost:8080/health`**

> 💡 OAuth / PortOne / Cloudinary / 메일 관련 환경변수를 생략해도 서버는 정상 기동됩니다. 단, 소셜 로그인·결제/구독·이미지 업로드·이메일 인증처럼 해당 외부 연동이 필요한 기능만 실제 키가 있어야 동작합니다.

---

### 3. Frontend 실행

```bash
cd frontend
npm install

# .env.local 생성
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

npm run dev
```

- 프론트엔드는 **`http://localhost:3000`** 에서 실행됩니다.
- 백엔드 CORS 허용 목록에 `http://localhost:3000`이 포함되어 있어 별도 설정 없이 연동됩니다.

---

### 4. (선택) Docker Compose로 한 번에 실행

`backend + MySQL + Nginx + Certbot` 구성을 컨테이너로 실행합니다.

```bash
# 루트에 .env.dev 파일 작성
#   DB_NAME=findanswer
#   DB_USERNAME=findanswer
#   DB_PASSWORD=findanswer123
#   DB_ROOT_PASSWORD=rootpassword
#   JWT_SECRET_KEY=... (그 외 OAuth / PortOne / Cloudinary / 메일 키 등)

docker compose up -d
```

> ℹ️ 이 방식은 Nginx 리버스 프록시를 포함한 배포에 가까운 구성입니다. 프런트엔드까지 함께 붙여 빠르게 확인하려면 위의 **1~3단계(로컬 개별 실행)** 방식을 권장합니다.

---

### ✅ 실행 확인 체크리스트

1. `http://localhost:8080/health` 응답 확인 → 백엔드 정상 기동
2. `http://localhost:8080/swagger-ui/index.html` 접속 → API 문서 확인
3. 프론트 `http://localhost:3000`에서 회원가입 → 로그인 → 질문 작성 흐름 테스트
4. 로그 상단의 datasource URL이 **`localhost`(로컬 DB)** 로 찍히는지 확인 (배포 DB가 아닌지)

---

## ⚙️ 주요 환경변수

| 변수 | 설명 |
|------|------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` | 데이터베이스 연결 정보 |
| `JWT_SECRET_KEY` | JWT 서명 시크릿 |
| `JWT_ACCESS_TOKEN_EXPIRATION_MS` | Access Token 만료(기본 900000ms = 15분) |
| `JWT_REFRESH_TOKEN_EXPIRATION_MS` | Refresh Token 만료(기본 1209600000ms = 14일) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 구글 OAuth |
| `KAKAO_REST_API_KEY` / `KAKAO_CLIENT_SECRET` / `KAKAO_ADMIN_KEY` | 카카오 OAuth |
| `SUCCESS_FRONT_REDIRECT_URI` / `FAILURE_FRONT_REDIRECT_URI` | OAuth 성공/실패 리다이렉트 |
| `PORTONE_STORE_ID` / `PORTONE_API_SECRET` / `PORTONE_API_BASE_URL` | PortOne 스토어/API 인증 정보 |
| `PORTONE_CHANNEL_KEY_PAYMENT` / `PORTONE_CHANNEL_KEY_BILLING` | PortOne 결제/빌링키 채널 키 |
| `PORTONE_WEBHOOK_SECRET` | PortOne 웹훅 서명 검증 시크릿 |
| `PORTONE_PAYMENT_ID_PREFIX` / `PORTONE_BILLING_ISSUE_ID_PREFIX` | PortOne 결제/빌링키 발급 ID 접두사 |
| `CLOUDINARY_URL` | Cloudinary 이미지 업로드 연동 |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | 이메일 인증 코드 발송용 SMTP 계정 |
| `UPLOAD_DIR` | 첨부파일(일반 파일) 저장 디렉터리 |
| `NEXT_PUBLIC_API_URL` | (Frontend) 백엔드 API 주소 |

---

## 🔒 보안 설계

- **인증 방식**: 무상태(Stateless) JWT — Access Token은 `Authorization: Bearer` 헤더, Refresh Token은 `HttpOnly` + `Secure` + `SameSite=None` 쿠키
- **Refresh Token 저장**: DB에 원문이 아닌 **해시값**으로 저장
- **비밀번호**: BCrypt 단방향 암호화
- **결제 웹훅**: PortOne 웹훅은 서명(`webhook-signature`)을 원문 바디 기준으로 검증한 뒤에만 처리, 중복 이벤트는 `WebhookEvent` 유니크 제약으로 무시
- **전역 예외 처리**: `GlobalExceptionHandler`에서 예외 타입 → HTTP 상태 코드 매핑을 한 곳에서 관리 (`ErrorCode`, `OAuth2ErrorCode`)
- **CORS**: 허용 Origin 화이트리스트 (localhost, Vercel 배포 도메인)
- **접근 제어**: 공개 API(질문/멘토 조회 등)와 인증 필요 API, `ADMIN` 전용 API 분리 — `ADMIN` API는 URL 패턴(`SecurityConfig`) 매칭뿐 아니라 컨트롤러 레벨 `@PreAuthorize`로 이중 검증

---

## 👥 팀

멋쟁이사자처럼 백엔드 24기 — 5팀 (FindAnswer)
| 이름 | 역할 |
|--|---|
| 김선우 | 팀장 |
| 이상민 | 부팀장 |
| 박준성 | 팀원 |
| 이동건 | 팀원 |
