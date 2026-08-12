import { request } from "./client";

export function signup({ email, password, name }) {
  return request("/api/auth/signup", {
    method: "POST",
    body: { email: email.trim(), password, name: name.trim() },
    fallbackMessage: "회원가입에 실패했습니다.",
  });
}

export function login({ email, password }) {
  return request("/api/auth/login", {
    method: "POST",
    body: { email: email.trim(), password },
    fallbackMessage: "로그인에 실패했습니다.",
  });
}

// 토큰은 request 헬퍼가 localStorage에서 읽어 자동으로 붙인다.
// (명시적 헤더로 넘기면 401 자동 refresh 재시도 때 옛 토큰이 재사용되어 갱신이 안 됨)
export function getMe() {
  return request("/api/users/me", {
    fallbackMessage: "사용자 정보를 불러오지 못했습니다.",
  });
}

export function logout() {
  return request("/api/auth/logout", {
    method: "POST",
    fallbackMessage: "로그아웃에 실패했습니다.",
  });
}