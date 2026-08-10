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

export function getMe(token) {
  return request("/api/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function logout() {
  return request("/api/auth/logout", {
    method: "POST",
    fallbackMessage: "로그아웃에 실패했습니다.",
  });
}