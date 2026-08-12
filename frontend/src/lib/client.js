const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다.");
}

export function startOAuth(provider) {
  window.location.href = `${API_URL}/oauth2/authorization/${provider}`;
}

// 하나의 request 함수 선언
export async function request(
  path,
  { body, fallbackMessage = "요청에 실패했습니다.", ...options } = {}
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