"use client";

import styles from "./SocialLoginButtons.module.css";
import { GoogleIcon, KakaoIcon } from "../../components/Icons/Icons";

import { startOAuth } from "@/lib/client";

export function GoogleLoginButton({
  label = "Google로 계속하기",
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={() => startOAuth("google")}
      disabled={disabled}
      className={`${styles.button} ${styles.google}`}
    >
      <span className={styles.icon}>
        <GoogleIcon />
      </span>

      {label}
    </button>
  );
}

export function KakaoLoginButton({
  label = "카카오로 계속하기",
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={() => startOAuth("kakao")}
      disabled={disabled}
      className={`${styles.button} ${styles.kakao}`}
    >
      <span className={styles.icon}>
        <KakaoIcon />
      </span>

      {label}
    </button>
  );
}

export default function SocialLoginButtons({ disabled }) {
  return (
    <div className={styles.container}>
      <GoogleLoginButton disabled={disabled} />
      <KakaoLoginButton disabled={disabled} />
    </div>
  );
}