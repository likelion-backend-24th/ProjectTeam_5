const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다.");
}

export async function getHealth() {
  const startedAt = performance.now();

  const response = await fetch(`${API_URL}/health`, {
    method: "GET",
    cache: "no-store",
  });

  const responseTime = Math.round(performance.now() - startedAt);
  const responseBody = await response.text();

  if (!response.ok) {
    const error = new Error(
      responseBody || "백엔드 상태를 확인하지 못했습니다."
    );

    error.status = response.status;
    error.responseTime = responseTime;

    throw error;
  }

  return {
    status: responseBody,
    responseTime,
  };
}

export function getApiBaseUrl() {
  return API_URL;
}