# FindAnswer (MentorBridge)

> 멘토와 멘티를 잇는 Q&A 멘토링 플랫폼 — 궁금한 것을 질문하고 전문가(멘토)에게 답변받는 지식 공유 서비스

멋쟁이사자처럼 백엔드 24기 5팀 포트폴리오 프로젝트입니다. 사용자는 카테고리별로 질문을 등록하고, 승인된 멘토들이 답변(및 대댓글)을 달아주는 커뮤니티형 멘토링 플랫폼입니다.

---

## 📌 주요 기능

### 인증 / 계정
- **일반 회원가입 / 로그인** — 이메일 + 비밀번호 (BCrypt 암호화)
- **소셜 로그인(OAuth2)** — Google, Kakao
- **JWT 인증** — Access Token(15분) + Refresh Token(14일, HttpOnly 쿠키)
- Refresh Token은 해시값으로 저장하여 보안 강화
- 프로필 수정(이름·관심분야), 이메일·비밀번호 변경, 회원 탈퇴(OAuth 연결 해제 포함)

### 질문(Question)
- 질문 작성 / 수정 / 삭제 (작성자 본인만)
- 카테고리별 목록 조회 및 키워드 검색
- 페이징 지원 (기본 10개, 최신순 정렬)
- 질문 상세 조회

### 답변(Answer)
- 특정 질문에 대한 답변 작성 / 수정 / 삭제
- **대댓글(답변의 답변)** 기능 지원 (부모-자식 계층 구조)

### 멘토(Mentor)
- 일반 사용자의 멘토 신청 및 신청 상태 조회
- 관리자(ADMIN)의 멘토 신청 목록 조회 / 승인 / 거절
- 승인 시 사용자 권한이 `USER` → `MENTOR`로 승격

### 운영
- Actuator + Prometheus 기반 헬스체크 / 모니터링
- Swagger(OpenAPI) 기반 API 문서 자동화

---

## 🛠 기술 스택

### Backend
| 구분 | 기술 |
|------|------|
| Language | Java 17 |
| Framework | Spring Boot 4.1.0 |
| Persistence | Spring Data JPA (Hibernate) |
| Security | Spring Security, OAuth2 Client, JWT (jjwt 0.12.5) |
| Database | PostgreSQL (운영/개발), MySQL 8.4 (Docker), H2 (테스트) |
| Docs | springdoc-openapi (Swagger UI) |
| Monitoring | Spring Actuator, Micrometer + Prometheus |
| Build | Gradle |

### Frontend
| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Library | React 19 |
| Styling | Tailwind CSS 4, CSS Modules |
| Icons | react-icons |

### Infra / DevOps
- Docker / Docker Compose (backend + MySQL + Nginx + Certbot)
- Nginx 리버스 프록시, Let's Encrypt(Certbot) HTTPS
- GitHub Actions CI/CD (`backend-ci-workflow`, `backend-deploy-workflow`)
- 배포: Vercel(Frontend), Supabase PostgreSQL(DB)

---

## 📂 프로젝트 구조

```
ProjectTeam_5/
├── backend/                      # Spring Boot 애플리케이션
│   └── src/main/java/com/example/findAnswer/
│       ├── FindAnswerApplication.java
│       └── mentorbridge/
│           ├── controller/       # Auth, User, Question, Answer, Admin, Health
│           ├── service/          # 비즈니스 로직
│           ├── repository/       # JPA Repository
│           ├── entity/           # User, Question, Answer, MentorApplication,
│           │                     #   OAuthAccount, RefreshToken, BaseTimeEntity
│           ├── dto/              # 요청/응답 DTO (answer, question, user, oauth, ...)
│           ├── jwt/              # JwtTokenProvider, JwtAuthenticationFilter
│           ├── config/           # SecurityConfig, SwaggerConfig
│           ├── handler/          # 전역 예외 처리, OAuth 성공/실패 핸들러
│           ├── constants/        # Role, Provider, ErrorCode, 상태 enum
│           └── ...               # exception, factory, listener, client
│
├── frontend/                     # Next.js 애플리케이션
│   └── src/
│       ├── app/                  # App Router 페이지
│       │   ├── (auth)/           # 로그인 · 회원가입
│       │   ├── questions/        # 질문 목록/상세/작성/수정, 답변
│       │   ├── mentor-articles/  # 멘토 아티클
│       │   ├── profile/          # 마이페이지
│       │   ├── oauth/            # 소셜 로그인 콜백
│       │   └── contexts/         # AuthContext
│       ├── components/           # Header, Icons
│       ├── lib/                  # API 클라이언트 (auth, questions, users, ...)
│       └── constants/            # 라우트 상수
│
├── docker-compose.yml            # backend + MySQL + Nginx + Certbot
├── compose.dev.yaml / compose.prod.yaml
└── .github/workflows/            # CI/CD 파이프라인
```

---

## 🗂 데이터 모델 (핵심 엔티티)

| 엔티티 | 설명 | 주요 관계 |
|--------|------|-----------|
| **User** | 사용자 (email, password, name, interests, role) | `1:N` MentorApplication |
| **Question** | 질문 게시글 (title, content, category) | `N:1` User, `1:N` Answer |
| **Answer** | 답변 (content, 대댓글용 self-reference) | `N:1` Question, `N:1` User, `1:N` children |
| **MentorApplication** | 멘토 신청 (status: PENDING/APPROVED/REJECTED) | `N:1` User |
| **OAuthAccount** | 소셜 계정 연동 정보 | `N:1` User |
| **RefreshToken** | Refresh Token 저장 (해시값) | `N:1` User |
| **BaseTimeEntity** | 생성/수정 시각 공통 필드 | (상속용) |

**Role**: `USER`(일반) · `MENTOR`(전문가) · `ADMIN`(관리자)

---

## 🔌 API 개요

Base URL: `/api`

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
| PATCH | `/me` | 프로필(이름·관심분야) 수정 |
| PATCH | `/me/email` | 이메일 수정 |
| PATCH | `/me/password` | 비밀번호 수정 |
| DELETE | `/me` | 회원 탈퇴 |
| POST | `/me/mentor/application` | 멘토 신청 |
| GET | `/me/mentor/application` | 내 멘토 신청 상태 조회 |

### Question (`/api/questions`)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/` | 목록 조회 / 검색 (`keyword`, `category`, 페이징) | ✕ |
| GET | `/{questionId}` | 상세 조회 | ✕ |
| POST | `/` | 질문 작성 | ○ |
| PATCH | `/{questionId}` | 질문 수정 | ○ (작성자) |
| DELETE | `/{questionId}` | 질문 삭제 | ○ (작성자) |

### Answer
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/questions/{questionId}/answers` | 답변 작성 |
| GET | `/api/questions/{questionId}/answers` | 답변 목록 조회 |
| PATCH | `/api/answers/{answerId}` | 답변 수정 |
| DELETE | `/api/answers/{answerId}` | 답변 삭제 |

### Admin (`/api/admin`) — `ADMIN` 권한 전용
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/mentors/applications` | 멘토 신청 목록 조회 |
| PATCH | `/mentors/{userId}/approval` | 멘토 승인 |
| PATCH | `/mentors/{userId}/rejection` | 멘토 거절 |

### 소셜 로그인
- `GET /oauth2/authorization/{provider}` — `provider`: `google`, `kakao`
- 성공 시 프론트엔드 콜백(`/oauth/callback`)으로 리다이렉트

> 전체 API 명세는 애플리케이션 실행 후 **Swagger UI** (`/swagger-ui/index.html`)에서 확인할 수 있습니다.

---

## 🚀 시작하기

### 사전 준비
- Java 17
- Node.js (Next.js 16 지원 버전)
- Docker & Docker Compose (선택)
- PostgreSQL 또는 MySQL

### 1. Backend 실행

```bash
cd backend

# 환경변수 설정 (예시 — 실제 값은 .env 또는 실행 환경에 주입)
# DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD
# JWT_SECRET_KEY
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, KAKAO_ADMIN_KEY

./gradlew bootRun
```

기본 프로필은 `dev`이며, 미설정 시 개발용 기본값으로 동작합니다. 서버는 `8080` 포트에서 실행됩니다.

### 2. Frontend 실행

```bash
cd frontend
npm install

# .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8080

npm run dev
```

프론트엔드는 `3000` 포트에서 실행됩니다.

### 3. Docker Compose로 실행 (Backend + DB + Nginx)

```bash
# .env.dev 파일에 DB_NAME, DB_USERNAME, DB_PASSWORD, DB_ROOT_PASSWORD 등 설정
docker compose up -d
```

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
| `NEXT_PUBLIC_API_URL` | (Frontend) 백엔드 API 주소 |

---

## 🔒 보안 설계

- **인증 방식**: 무상태(Stateless) JWT — Access Token은 `Authorization: Bearer` 헤더, Refresh Token은 `HttpOnly` + `Secure` + `SameSite=None` 쿠키
- **Refresh Token 저장**: DB에 원문이 아닌 **해시값**으로 저장
- **비밀번호**: BCrypt 단방향 암호화
- **전역 예외 처리**: `GlobalExceptionHandler`에서 예외 타입 → HTTP 상태 코드 매핑을 한 곳에서 관리 (`ErrorCode`, `OAuth2ErrorCode`)
- **CORS**: 허용 Origin 화이트리스트 (localhost, Vercel 배포 도메인)
- **접근 제어**: 공개 API(질문 조회 등)와 인증 필요 API, `ADMIN` 전용 API 분리

---

## 👥 팀

멋쟁이사자처럼 백엔드 24기 — 5팀 (FindAnswer)


| 이름 | 역할 |
|--|---|
| 김선우 | 팀장 |
| 이상민 | 부팀장 |
| 박준성 | 팀원 |
| 이동건 | 팀원 |


---

## main 브랜치를 참조하여 확인하시면 됩니다.

⚙️ 로컬 실행 방법 (Getting Started)


환경 변수 설정
   - 백엔드 .env.dev 파일 생성 후 데이터베이스 및 OAuth 키 설정
   - 프론트엔드 .env 파일 생성 후 NEXT_PUBLIC_API_URL 설정

Docker Compose를 이용한 일괄 실행
   ```bash
   docker-compose -f docker-compose.yml up -d --build
```
