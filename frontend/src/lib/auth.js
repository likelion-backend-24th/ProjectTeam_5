const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL이 설정되지 않았습니다.");
}

export async function signup(signupData) {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: signupData.email.trim(),
      password: signupData.password,
      name: signupData.name.trim(),
    }),
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  const responseData = isJson
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof responseData === "object"
        ? responseData.message ||
          responseData.error ||
          "회원가입에 실패했습니다."
        : responseData || "회원가입에 실패했습니다.";

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = responseData;

    throw error;
  }

  return responseData;
}


export async function login(loginDate) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: loginDate.email.trim(),
      password: loginDate.password,
    }),
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  const responseData = isJson
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof responseData === "object"
        ? responseData.message ||
          responseData.error ||
          "로그인에 실패했습니다."
        : responseData || "로그인에 실패했습니다.";

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = responseData;

    throw error;
  }

  return responseData;
}