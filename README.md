# FindAnswer (MentorBridge)

> 궁금한 것을 질문하면 승인된 멘토가 답해주고, 마음에 드는 멘토는 요금제를 구독해 전용 아티클과 1:1 채팅까지 이용하는 유료 구독형 Q&A 멘토링 플랫폼입니다.

| 구분 | 링크 |
| --- | --- |
| 서비스 | https://like-lion-team5-find-answer.vercel.app |
| API 문서 | https://api-findanswer.duckdns.org/swagger-ui/index.html |
| 헬스체크 | https://like-lion-team5-find-answer.vercel.app/health |

> 멋쟁이사자처럼 백엔드 24기 5팀 포트폴리오 프로젝트입니다.

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 개발 기간 | 2026.07.29 ~ 2026.08.27 |
| 팀 구성 | Backend 4명 (프론트엔드 공통 작업 병행) |
| 주요 사용자 | 실무 질문에 답을 찾는 학생·주니어와, 지식을 유료로 제공하려는 현직자 |
| 해결하려는 문제 | 질문은 커뮤니티에, 깊은 상담은 유료 플랫폼에 흩어져 있어 "무료 Q&A → 특정 멘토 심화"로 이어지는 경로가 없습니다. |
| 핵심 가치 | 무료 질문·답변으로 멘토를 먼저 발견하게 하고, 그 멘토를 구독하면 전용 아티클·1:1 채팅으로 연결되도록 만들었습니다. |

### 핵심 사용자 흐름

```text
회원가입/소셜 로그인 → 질문 작성 → 멘토 답변 → 멘토 프로필 발견
멘토 신청 → 관리자 승인 → 멘토 활동(아티클·요금제)
결제수단(빌링키) 등록 → 요금제 구독(즉시 청구) → 멘토 전용 아티클 · 1:1 채팅
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
│   └── backend/src/main/java/com/example/findAnswer/mentorbridge/
├── controller/     # 요청 검증, 인증 주체 추출만 담당
├── service/        # 비즈니스 로직 (Payment/Subscription/OAuth 등 도메인별)
├── repository/     # JPA Repository
├── entity/         # User, Question/Answer, Mentor, Payment, Subscription, ChatRoom 등
├── dto/            # 도메인별 요청/응답 DTO
├── jwt/            # JwtTokenProvider, JwtAuthenticationFilter
├── config/         # SecurityConfig, SwaggerConfig
├── handler/        # 전역 예외 처리, OAuth 성공/실패 핸들러
├── webhook/         # PortOne 웹훅 서명 검증
├── client/         # PortOne, Kakao Unlink 등 외부 API 클라이언트
└── constants/       # Role, Provider, ErrorCode, 상태 enum

frontend/src/
├── app/            # Next.js App Router 페이지 (도메인별 디렉터리)
├── components/      # 공통 컴포넌트
└── lib/            # 백엔드 API 클라이언트
```

## API 개요
> 전체 명세는 실행 후 **Swagger UI**(`/swagger-ui/index.html`)에서 확인할 수 있습니다.

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

### 결제 확정을 PG 즉시 응답이 아닌 "서버 재조회"로 판정

- 상황: 결제창/빌링키 청구의 즉시 응답은 클라이언트를 거치므로 그대로 신뢰하면 금액·상태 위조 가능성이 있습니다.
- 결정: 응답과 별개로 서버가 PortOne에 결제를 재조회해 상태·금액을 대조한 뒤에만 구독을 활성화하고, 웹훅은 서명을 **원문 바디 기준으로** 검증한 다음 `WebhookEvent` 유니크 제약으로 중복 수신을 무시합니다.
- 결과·한계: 클라이언트 위조와 웹훅 중복 도달을 모두 차단했습니다. 다만 결제 실패를 예외로 던지는 경로가 남아 있어, 실패 이력을 기록하는 트랜잭션까지 함께 롤백되는 구간이 있습니다(개선 계획 참고).

### Access Token을 localStorage가 아닌 메모리에 보관

- 상황: Access Token을 localStorage에 두면 XSS 한 번에 토큰이 그대로 유출되고, 새로고침마다 남아 있는 만료 토큰으로 첫 요청이 실패하는 문제도 있었습니다.
- 결정: Access Token은 모듈 스코프 변수(`tokenStore.js`)에만 두고, 새로고침 시에는 `HttpOnly` Refresh 쿠키로 세션을 복원합니다. Refresh Token은 DB에 해시로 저장하고 재발급 때마다 회전시킵니다.
- 결과·한계: 스크립트로 토큰을 읽어갈 수 없고, 탈취된 Refresh Token은 다음 회전에서 무효화됩니다. 대신 탭마다 첫 진입에 재발급 요청이 한 번 더 발생합니다.

### 정산 계좌번호를 컬럼 단위로 암호화하고 점진 마이그레이션

- 상황: 정산 계좌번호가 평문으로 저장되고 검증 로그에도 그대로 찍히고 있었습니다. 이미 저장된 행이 있어 스키마를 한 번에 바꾸기도 어려웠습니다.
- 결정: JPA `AttributeConverter`(`EncryptedStringConverter`)로 AES-256-GCM 암호화를 적용하고, 암호문에 `enc:v1:` 접두사를 붙였습니다. 읽을 때 접두사가 없으면 평문으로 간주해 그대로 반환하므로 **기존 행을 건드리지 않고도** 새로 저장되는 값부터 암호화됩니다. 로그는 뒷 4자리만 남기도록 마스킹했습니다.
- 결과·한계: 무중단으로 암호화를 도입했고, 키가 비면 애플리케이션이 아예 뜨지 않아 "설정을 깜빡해 평문 저장"이 불가능합니다. 다만 예금주명은 아직 평문이고, 기존 평문 행을 채우는 일괄 마이그레이션은 남아 있습니다.

### 정산 상태 전이를 서비스가 아닌 엔티티가 지키게 함

- 상황: 관리자 화면에서 정산 완료를 두 번 누르면 이미 완료된 건이 다시 완료 처리됐습니다. 검증이 서비스 계층에만 있어, 다른 경로로 호출하면 그대로 통과했습니다.
- 결정: `Settlement.complete()`가 현재 상태를 확인해 `REQUESTED`가 아니면 예외를 던지도록 상태 기계를 **엔티티 안으로** 옮기고, 서비스는 그 위에서 권한만 검사합니다.
- 결과·한계: 어떤 경로로 호출해도 잘못된 전이가 막힙니다. 다만 동시 요청에 대한 비관적 락은 아직 없어, 완전한 직렬화는 개선 과제로 남았습니다.


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

## 팀과 기여

멋쟁이사자처럼 백엔드 24기 — 5팀 (FindAnswer)

| 이름 | 역할 | 담당 도메인 |
| --- | --- | --- |
| 김선우 | 팀장 | DB, 질문/답변, 피드, 구독, 관리자/신고 |
| 이상민 | 부팀장 | 멘토 정산, 멘토 설정 (가이드라인 및 계좌), 멘토 신청 - 이메일 인증, 일반 QnA 게시판 |
| 박준성 | 팀원 | 결제수단 등록, 결제 시스템, OAuth 로그인, 배포 |
| 이동건 | 팀원 | 인증·인가(JWT/Security), 회원가입·로그인, 멘토 1:1 채팅, 알림 |

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

- ## Documentation

| 문서 | 위치 | 용도 |
| --- | --- | --- |
| ERD | [docs/erd.md](./docs/ERD.md) | 데이터 모델 |
| DDL | [docs/postgres/00_ddl.sql](./docs/schema_mentorbridge.sql) | 스키마 정의 |
| 시드 데이터 | [docs/postgres](./docs/질문_더미데이터.sql) | 초기 데이터 스크립트 |
| 설계 문서 | [docs/](./docs/) | 요구사항·기능명세·API·ERD·권한·사용자흐름·시퀀스·화면설계 |
| API 문서 | Swagger UI (`https://api-findanswer.duckdns.org/swagger-ui/index.html`) | 전체 API 명세 |


Notion : https://app.notion.com/p/5-db7f03c41e89838d945001e855fcb7b4
