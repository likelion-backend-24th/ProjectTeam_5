const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다.");
}

export async function request(path, { body, fallbackMessage = "요청에 실패했습니다.", ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof data === "object" ? data?.message || data?.error : data) || fallbackMessage;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}