import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStore";

// 다른 lib 모듈이 raw fetch를 쓸 때도 이 값을 가져다 쓴다(BACKEND_URL을 각자 다시 선언하지 않는다) —
// 그래야 배포 환경에 NEXT_PUBLIC_API_URL이 빠졌을 때 "일부만 조용히 localhost로 붙는" 현상 없이 전체가
// 똑같이 바로 실패한다.
export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다.");
}

export function startOAuth(provider) {
  window.location.href = `${API_URL}/oauth2/authorization/${provider}`;
}

// AccessToken 만료(401) 시 refresh 토큰(HttpOnly 쿠키)으로 새 AccessToken을 발급받는다.
// 새로고침 직후처럼 메모리에 AccessToken이 아예 없을 때 세션을 복구하는 용도로도 쓴다(AuthContext 참고).
// 동시에 여러 요청이 401을 받으면 각자 refresh를 호출하는데, 서버는 refresh 토큰을 회전시킨다
// (RefreshTokenService). 두 번째 호출은 이미 무효가 된 쿠키를 제시해 실패하고, 그러면 세션이 끊긴 것으로
// 판단해 로그아웃돼 버린다. 멘토 대시보드가 Promise.all로 11개를 동시에 쏘기 때문에 확실하게 재현된다.
// 진행 중인 refresh가 있으면 그 약속을 그대로 나눠 쓴다.
let refreshPromise = null;

export function tryRefreshToken() {
  if (!refreshPromise) {
    refreshPromise = doRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefreshToken() {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    const newToken = data?.accessToken;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

// JWT 토큰 페이로드에서 sub/userId 파싱하는 헬퍼 함수
function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.sub || parsed.userId || parsed.id || null;
  } catch {
    return null;
  }
}

export async function request(
  path,
  { body, fallbackMessage = "요청에 실패했습니다.", _retry = false, ...options } = {}
) {
  const token = getAccessToken();

  // X-USER-ID 추출 (localStorage 키 순회 -> user 객체 JSON -> JWT 토큰 디코딩 순)
  let userId = null;
  if (typeof window !== "undefined") {
    userId =
      localStorage.getItem("userId") ||
      localStorage.getItem("id") ||
      localStorage.getItem("user_id");

    if (!userId) {
      const userJson = localStorage.getItem("user") || localStorage.getItem("userInfo");
      if (userJson) {
        try {
          const parsed = JSON.parse(userJson);
          userId = parsed.id || parsed.userId || parsed.user_id;
        } catch {
          // JSON 파싱 실패 시 무시
        }
      }
    }

    // Storage에 없을 경우 토큰 내 페이로드 파싱 시도
    if (!userId && token) {
      userId = getUserIdFromToken(token);
    }
  }

  // 백엔드가 X-USER-ID에 비어있지 않은 문자열을 필수 전달 요구함
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { "X-USER-ID": String(userId) } : {}),
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // 401(AccessToken 만료 추정) → refresh 후 원요청 1회 재시도.
  if (
    response.status === 401 &&
    !_retry &&
    typeof window !== "undefined" &&
    !path.startsWith("/api/auth/")
  ) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      return request(path, { body, fallbackMessage, _retry: true, ...options });
    }
    clearAccessToken();
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let serverMessage = typeof data === "object" ? data?.message || data?.error : data;
    let message = serverMessage;

    if (!message) {
      if (response.status === 401 || response.status === 403) {
        message = "로그인이 필요한 서비스입니다.";
      } else {
        message = fallbackMessage;
      }
    }

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}