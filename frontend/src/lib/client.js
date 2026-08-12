const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다.");
}

export function startOAuth(provider) {
  window.location.href = `${API_URL}/oauth2/authorization/${provider}`;
}

// AccessToken 만료(401) 시 refresh 토큰(HttpOnly 쿠키)으로 새 AccessToken을 발급받는다.
// 성공하면 새 토큰을 localStorage에 저장하고 반환, 실패하면 null.
async function tryRefreshToken() {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include", // refresh 쿠키 전송
    });
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    const newToken = data?.accessToken;
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

// 하나의 request 함수 선언
export async function request(
  path,
  { body, fallbackMessage = "요청에 실패했습니다.", _retry = false, ...options } = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("accessToken")
      : null;

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // 401(AccessToken 만료 추정) → refresh 후 원요청 1회 재시도.
  // 무한루프 방지: 이미 재시도했거나(_retry), auth 엔드포인트 자체는 제외.
  if (
    response.status === 401 &&
    !_retry &&
    typeof window !== "undefined" &&
    !path.startsWith("/api/auth/")
  ) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      // 재시도: 헬퍼가 localStorage의 새 토큰을 다시 읽어 Authorization을 붙인다.
      // (options.headers 에 명시적 Authorization을 넘긴 호출은 그 값이 우선하니 주의)
      return request(path, { body, fallbackMessage, _retry: true, ...options });
    }
    // refresh 실패 → 로그인 만료. 토큰 정리.
    localStorage.removeItem("accessToken");
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // 백엔드 에러 메시지(data.message) 우선 추출
    let serverMessage = typeof data === "object" ? data?.message || data?.error : data;

    let message = serverMessage;

    // 백엔드 메시지가 없을 때만 기본 처리
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
