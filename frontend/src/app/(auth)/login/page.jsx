"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await login({
        email: form.email,
        password: form.password,
      });

      console.log("로그인 응답:", response);

      /*
       * 백엔드가 토큰을 JSON으로 내려주는 경우에만 사용
       *
       * 응답 필드명이 accessToken인지 token인지
       * 실제 LoginResponse DTO를 보고 맞춰야 한다.
       */
      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
      }

      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("로그인 실패:", error);

      if (error.status === 401) {
        setErrorMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      setErrorMessage(
        error.message || "로그인 중 문제가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.loginContainer}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <span>M</span>
          </div>

          <h1>MentorBridge</h1>
        </div>

        <p className={styles.description}>
          로그인하여 멘토링을 시작하세요
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">이메일</label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="이메일을 입력해주세요"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">비밀번호</label>

            <div className={styles.passwordInput}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력해주세요"
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword
                    ? "비밀번호 숨기기"
                    : "비밀번호 보기"
                }
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className={styles.loginButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className={styles.signup}>
          <span>계정이 없으신가요?</span>
          <Link href="/signup">회원가입 하기</Link>
        </div>
      </section>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-2.1 3.3" />
      <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 4.2-.9" />
    </svg>
  );
}