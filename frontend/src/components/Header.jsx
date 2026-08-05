"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import styles from "./Header.module.css";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("accessToken")));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/questions" className={styles.brand}>
          <span className={styles.logo}>M</span>
          <span>MentorBridge</span>
        </Link>

        <nav className={styles.nav}>
          <Link
            href="/questions"
            className={
              pathname?.startsWith("/questions")
                ? styles.navActive
                : undefined
            }
          >
            질문피드
          </Link>

          <Link href="/profile">내 프로필</Link>
        </nav>

        <div className={styles.authArea}>
          {isLoggedIn ? (
            <>
              <span className={styles.badge}>USER</span>
              <button type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
