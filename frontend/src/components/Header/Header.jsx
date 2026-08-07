"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Header.module.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, loading, logout } = useAuth();


  const handleLogout = () => {
    logout();
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
              pathname?.startsWith("/questions") ? styles.navActive : undefined
            }
          >
            질문피드
          </Link>

          <Link
            href="/profile"
            className={
              pathname?.startsWith("/profile") ? styles.navActive : undefined
            }
          >
            내 프로필
          </Link>
        </nav>

        <div className={styles.authArea}>
          {isLoggedIn ? (
            <>
              <span>{user.name}</span>
              <button onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <Link href="/login">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}
