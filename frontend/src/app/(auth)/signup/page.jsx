"use client";
import { signup } from "@/lib/auth";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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

    if (form.password.length < 8) {
      setErrorMessage("비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await signup({
        email: form.email,
        password: form.password,
        name: form.name,
      });

      alert("회원가입이 완료되었습니다.");
      router.push("/login");
    } catch (error) {
      console.error("회원가입 실패:", error);

      if (error.status === 409) {
        setErrorMessage("이미 사용 중인 이메일입니다.");
        return;
      }

      setErrorMessage(error.message || "회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.signupContainer}>
        <h1 className={styles.title}>MentorBridge 가입하기</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">이름</label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="1~20자 이름을 입력해주세요"
              autoComplete="name"
              minLength={1}
              maxLength={20}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">이메일</label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="이메일 주소를 입력해주세요"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">비밀번호</label>

            <div className={styles.passwordField}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="8자 이상 안전한 비밀번호"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={
                  showPassword ? "비밀번호 숨기기" : "비밀번호 표시하기"
                }
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="passwordConfirm">비밀번호 확인</label>

            <div className={styles.passwordField}>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                value={form.passwordConfirm}
                onChange={handleChange}
                placeholder="비밀번호를 한번 더 입력해주세요"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPasswordConfirm((previous) => !previous)}
                aria-label={
                  showPasswordConfirm
                    ? "비밀번호 확인 숨기기"
                    : "비밀번호 확인 표시하기"
                }
              >
                {showPasswordConfirm ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <div className={styles.infoBox}>
            <span aria-hidden="true">💡</span>

            <p>
              가입 시 기본 역할은 일반 회원(USER)입니다. 멘토 활동을 원하시면
              가입 후 프로필에서 멘토 신청이 가능합니다.
            </p>
          </div>

          {errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}

          <button
            className={styles.signupButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "가입 처리 중..." : "가입하기"}
          </button>
        </form>

        <div className={styles.loginLink}>
          <span>이미 계정이 있으신가요?</span>
          <Link href="/login">로그인하기</Link>
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
