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

  const handleProtectedNavigation = (e, targetPath, menuName) => {
    if (!isLoggedIn) {
      e.preventDefault();
      alert(`${menuName}은(는) 로그인 후 이용 가능합니다.`);
      router.push("/login");
    }
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
            href="/mentor-articles"
            onClick={(e) =>
              handleProtectedNavigation(e, "/mentor-articles", "멘토피드")
            }
            className={
              pathname?.startsWith("/mentor-articles")
                ? styles.navActive
                : undefined
            }
          >
            멘토피드
          </Link>

          <Link
            href="/profile"
            onClick={(e) =>
              handleProtectedNavigation(e, "/profile", "내 프로필")
            }
            className={
              pathname?.startsWith("/profile") ? styles.navActive : undefined
            }
          >
            내 프로필
          </Link>

          {/* 🔥 관리자(ADMIN) 역할일 때만 노출되는 탭 */}
          {!loading && isLoggedIn && user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={
                pathname?.startsWith("/admin") ? styles.navActive : undefined
              }
            >
              관리자
            </Link>
          )}
        </nav>

        <div className={styles.authArea}>
          {isLoggedIn ? (
            <>
              <div className={styles.userInfo}>
                <span>{user?.name}님</span>
                {user?.role === "ADMIN" && (
                  <span className={styles.badge}>ADMIN</span>
                )}
                {user?.role === "MENTOR" && (
                  <span className={styles.badge}>MENTOR</span>
                )}
              </div>
              <button type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}