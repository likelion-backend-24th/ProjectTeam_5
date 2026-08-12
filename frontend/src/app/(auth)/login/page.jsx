"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

import { useAuth } from "@/app/contexts/AuthContext";
import SocialLoginButtons from "@/app/oauth/SocialLoginButtons";
import { EyeIcon, EyeOffIcon } from "@/components/Icons/Icons";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // OAuth 로그인 실패 시 백엔드가 /login?errorCode=...&error=... 로 리다이렉트한다.
  // 진입 시 그 메시지를 읽어 표시하고, URL은 정리(새로고침 반복 표시 방지).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");        // URLSearchParams가 자동 디코딩
    const errorCode = params.get("errorCode");

    if (error || errorCode) {
      setErrorMessage(error || "로그인에 실패했습니다.");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

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

      await login(form.email, form.password);

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

        <SocialLoginButtons/>

        <div className={styles.signup}>
          <span>계정이 없으신가요?</span>
          <Link href="/signup">회원가입 하기</Link>
        </div>
      </section>
    </main>
  );
}
