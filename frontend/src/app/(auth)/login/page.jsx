"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; // 💡 useSearchParams 추가

import styles from "./page.module.css";

import { useAuth } from "@/app/contexts/AuthContext";
import SocialLoginButtons from "@/app/oauth/SocialLoginButtons";
import { EyeIcon, EyeOffIcon } from "@/components/Icons/Icons";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 💡 쿼리 파라미터 감지
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 💡 URL에 error 파라미터가 넘어왔을 때 메시지 자동 설정
  useEffect(() => {
    const errorType = searchParams.get("error");
    if (!errorType) return;

    if (errorType === "blocked" || errorType.includes("block")) {
      setErrorMessage("차단된 계정입니다. 관리자에게 문의하세요.");
    } else {
      setErrorMessage("소셜 로그인에 실패했습니다. 다시 시도해주세요.");
    }
  }, [searchParams]);

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

        <SocialLoginButtons />

        <div className={styles.signup}>
          <span>계정이 없으신가요?</span>
          <Link href="/signup">회원가입 하기</Link>
        </div>
      </section>
    </main>
  );
}