const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다.");
}

async function handleResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  const responseData = isJson
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof responseData === "object"
        ? responseData.message || responseData.error || fallbackMessage
        : responseData || fallbackMessage;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = responseData;

    throw error;
  }

  return responseData;
}

export async function getQuestions(page = 0, size = 10) {
  const response = await fetch(
    `${API_URL}/api/questions?page=${page}&size=${size}&sort=latest`,
    { cache: "no-store" }
  );

  return handleResponse(response, "질문 목록을 불러오지 못했습니다.");
}

export async function getQuestion(id) {
  const response = await fetch(`${API_URL}/api/questions/${id}`, {
    cache: "no-store",
  });

  return handleResponse(response, "질문을 불러오지 못했습니다.");
}

export async function getAnswers(id) {
  const response = await fetch(`${API_URL}/api/questions/${id}/answers`, {
    cache: "no-store",
  });

  return handleResponse(response, "답변을 불러오지 못했습니다.");
}
