"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getApiBaseUrl, getHealth } from "@/lib/health";

import styles from "./page.module.css";

const API_URL = getApiBaseUrl();

const swaggerUrl = `${API_URL}/swagger-ui/index.html`;
const apiDocsUrl = `${API_URL}/v3/api-docs`;

const authApis = [
  {
    method: "POST",
    path: "/api/auth/signup",
    description: "회원가입",
  },
  {
    method: "POST",
    path: "/api/auth/login",
    description: "로그인",
  },
  {
    method: "POST",
    path: "/api/auth/logout",
    description: "로그아웃",
  },
  {
    method: "GET",
    path: "/api/auth/me",
    description: "내 정보 조회",
  },
  {
    method: "POST",
    path: "/api/auth/refresh",
    description: "토큰 갱신",
  },
];

export default function HealthPage() {
  const router = useRouter();

  const [health, setHealth] = useState({
    loading: true,
    online: false,
    status: "",
    responseTime: null,
    checkedAt: null,
    error: "",
  });

  const checkHealth = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setHealth((previous) => ({
        ...previous,
        loading: true,
        error: "",
      }));
    }

    try {
      const result = await getHealth();

      setHealth({
        loading: false,
        online: true,
        status: result.status,
        responseTime: result.responseTime,
        checkedAt: new Date(),
        error: "",
      });
    } catch (error) {
      console.error("헬스체크 실패:", error);

      setHealth({
        loading: false,
        online: false,
        status: "ERROR",
        responseTime: error.responseTime ?? null,
        checkedAt: new Date(),
        error: error.message || "백엔드 서버에 연결할 수 없습니다.",
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    router.replace("/login");
  };

  const formattedCheckedAt = health.checkedAt
    ? health.checkedAt.toLocaleString("ko-KR")
    : "-";

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/health" className={styles.brand}>
          <span className={styles.brandIcon}>M</span>
          <span>MentorBridge</span>
        </Link>

        <nav className={styles.navigation}>
          <Link
            href="/health"
            className={`${styles.navigationItem} ${styles.active}`}
          >
            <span className={styles.navigationIcon}>♡</span>
            헬스체크
          </Link>

          <button type="button" className={styles.navigationItem} disabled>
            <span className={styles.navigationIcon}>⌕</span>
            멘토 찾기
          </button>

          <button type="button" className={styles.navigationItem} disabled>
            <span className={styles.navigationIcon}>□</span>
            멘토링 신청
          </button>

          <button type="button" className={styles.navigationItem} disabled>
            <span className={styles.navigationIcon}>♧</span>
            나의 멘토링
          </button>

          <button type="button" className={styles.navigationItem} disabled>
            <span className={styles.navigationIcon}>▱</span>
            메시지
          </button>

          <button type="button" className={styles.navigationItem} disabled>
            <span className={styles.navigationIcon}>◁</span>
            공지사항
          </button>

          <button type="button" className={styles.navigationItem} disabled>
            <span className={styles.navigationIcon}>♙</span>
            마이페이지
          </button>
        </nav>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
        >
          <span>⇥</span>
          로그아웃
        </button>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div />

          <div className={styles.userArea}>
            <button
              type="button"
              className={styles.notificationButton}
              aria-label="알림"
            >
              ♧
            </button>

            <div className={styles.avatar}>U</div>

            <div className={styles.userInfo}>
              <strong>사용자님</strong>
              <span>USER</span>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.healthSection}>
            <div className={styles.pageHeading}>
              <div>
                <h1>헬스체크</h1>
                <p>서비스 및 API 상태를 확인하세요.</p>

                <span className={styles.updatedAt}>
                  마지막 업데이트: {formattedCheckedAt}
                </span>
              </div>

              <button
                type="button"
                className={styles.refreshButton}
                onClick={checkHealth}
                disabled={health.loading}
              >
                {health.loading ? "확인 중..." : "새로고침"}
              </button>
            </div>

            <div className={styles.summaryGrid}>
              <StatusCard
                icon="✓"
                title="전체 상태"
                value={
                  health.loading ? "확인 중" : health.online ? "정상" : "오류"
                }
                healthy={health.online}
                loading={health.loading}
              />

              <StatusCard
                icon="▤"
                title="API 서버"
                value={
                  health.loading
                    ? "확인 중"
                    : health.online
                      ? "정상"
                      : "연결 실패"
                }
                healthy={health.online}
                loading={health.loading}
              />

              <StatusCard
                icon="DB"
                title="API 응답"
                value={health.status || "-"}
                healthy={health.online}
                loading={health.loading}
              />

              <StatusCard
                icon="◷"
                title="응답 시간"
                value={
                  health.responseTime !== null
                    ? `${health.responseTime}ms`
                    : "-"
                }
                healthy={health.online}
                loading={health.loading}
              />
            </div>

            {health.error && (
              <div className={styles.errorBox}>
                <strong>백엔드 연결 실패</strong>
                <p>{health.error}</p>
                <code>{`${API_URL}/health`}</code>
              </div>
            )}

            <section className={styles.panel}>
              <h2>상세 상태</h2>

              <div className={styles.tableWrapper}>
                <table className={styles.statusTable}>
                  <thead>
                    <tr>
                      <th>서비스</th>
                      <th>상태</th>
                      <th>응답 시간</th>
                      <th>설명</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      <td>
                        <span
                          className={
                            health.online ? styles.greenDot : styles.redDot
                          }
                        />
                        API Server
                      </td>

                      <td>
                        <StatusBadge
                          healthy={health.online}
                          loading={health.loading}
                        />
                      </td>

                      <td>
                        {health.responseTime !== null
                          ? `${health.responseTime}ms`
                          : "-"}
                      </td>

                      <td>
                        {health.online
                          ? "애플리케이션 서버가 정상적으로 동작 중입니다."
                          : "애플리케이션 서버에 연결할 수 없습니다."}
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <span className={styles.grayDot} />
                        Database
                      </td>
                      <td>
                        <span className={styles.pendingBadge}>미확인</span>
                      </td>
                      <td>-</td>
                      <td>
                        현재 헬스 API에서 데이터베이스 상태를 제공하지 않습니다.
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <span className={styles.grayDot} />
                        Redis
                      </td>
                      <td>
                        <span className={styles.pendingBadge}>미확인</span>
                      </td>
                      <td>-</td>
                      <td>현재 헬스 API에서 Redis 상태를 제공하지 않습니다.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.panel}>
              <h2>시스템 정보</h2>

              <dl className={styles.systemGrid}>
                <div>
                  <dt>API 주소</dt>
                  <dd>{API_URL}</dd>
                </div>

                <div>
                  <dt>프론트 환경</dt>
                  <dd>
                    {process.env.NODE_ENV === "production"
                      ? "production"
                      : "development"}
                  </dd>
                </div>

                <div>
                  <dt>헬스 엔드포인트</dt>
                  <dd>/health</dd>
                </div>

                <div>
                  <dt>최근 상태</dt>
                  <dd>{health.online ? "정상" : "연결 실패"}</dd>
                </div>
              </dl>
            </section>
          </section>

          <aside className={styles.swaggerPanel}>
            <div className={styles.swaggerHeading}>
              <span className={styles.documentIcon}>⌘</span>
              <h2>API 문서 (Swagger)</h2>
            </div>

            <div className={styles.documentSection}>
              <h3>Swagger UI</h3>

              <a
                href={swaggerUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.documentLink}
              >
                <span>{swaggerUrl}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className={styles.documentSection}>
              <h3>API Docs (JSON)</h3>

              <a
                href={apiDocsUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.documentLink}
              >
                <span>{apiDocsUrl}</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>

            <div className={styles.divider} />

            <section className={styles.apiSection}>
              <h3>주요 인증 API</h3>

              <div className={styles.apiList}>
                {authApis.map((api) => (
                  <div className={styles.apiItem} key={api.path}>
                    <span
                      className={
                        api.method === "GET"
                          ? styles.getMethod
                          : styles.postMethod
                      }
                    >
                      {api.method}
                    </span>

                    <code>{api.path}</code>
                    <span>{api.description}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className={styles.tipBox}>
              <strong>💡 TIP</strong>
              <p>
                Swagger UI 링크를 열면 백엔드에서 제공하는 전체 API 명세와
                요청·응답 구조를 확인할 수 있습니다.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatusCard({ icon, title, value, healthy, loading }) {
  const valueClassName = loading
    ? styles.loadingText
    : healthy
      ? styles.healthyText
      : styles.errorText;

  return (
    <article className={styles.statusCard}>
      <span className={styles.statusIcon}>{icon}</span>

      <div>
        <p>{title}</p>
        <strong className={valueClassName}>{value}</strong>
      </div>
    </article>
  );
}

function StatusBadge({ healthy, loading }) {
  if (loading) {
    return <span className={styles.pendingBadge}>확인 중</span>;
  }

  return (
    <span className={healthy ? styles.healthyBadge : styles.errorBadge}>
      {healthy ? "정상" : "오류"}
    </span>
  );
}
