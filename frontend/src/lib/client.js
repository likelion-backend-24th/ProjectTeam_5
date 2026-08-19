const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다.");
}

export function startOAuth(provider) {
  window.location.href = `${API_URL}/oauth2/authorization/${provider}`;
}

// AccessToken 만료(401) 시 refresh 토큰(HttpOnly 쿠키)으로 새 AccessToken을 발급받는다.
async function tryRefreshToken() {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
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
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || localStorage.getItem("accessToken")
      : null;

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
    localStorage.removeItem("accessToken");
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