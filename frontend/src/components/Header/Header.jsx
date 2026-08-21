"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import styles from "./Header.module.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user, loading, logout } = useAuth();

  // 드롭다운 상태 및 외부 클릭 감지용 Ref
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                href="/mentors"
                onClick={(e) =>
                    handleProtectedNavigation(e, "/mentors", "멘토피드")
                }
                className={
                  pathname?.startsWith("/mentors")
                      ? styles.navActive
                      : undefined
                }
            >
              멘토피드
            </Link>


            {!loading && isLoggedIn && (
                <Link
                    href="/chat"
                    className={
                      pathname?.startsWith("/chat") ? styles.navActive : undefined
                    }
                >
                  채팅
                </Link>
            )}


            {/* {!loading && isLoggedIn && user?.role === "ADMIN" && (
                <Link
                    href="/users"
                    onClick={(e) =>
                        handleProtectedNavigation(e, "/users", "유저 목록")
                    }
                    className={
                      pathname?.startsWith("/users") ? styles.navActive : undefined
                    }
                >
                  유저 목록
                </Link>
            )} */}



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

                  <div className={styles.userMenuContainer} ref={dropdownRef}>
                    <div
                        className={styles.userInfo}
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                    >
                      <span className={styles.userNameText}>{user?.name}님</span>
                      {user?.role === "ADMIN" && (
                          <span className={styles.badge}>ADMIN</span>
                      )}
                      {user?.role === "MENTOR" && (
                          <span className={styles.badge}>MENTOR</span>
                      )}
                      <span className={styles.arrow}>▼</span>
                    </div>

                    {isDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                          <Link
                              href="/profile"
                              className={styles.dropdownItem}
                              onClick={() => setIsDropdownOpen(false)}
                          >
                            내 프로필 (마이페이지)
                          </Link>
                          <Link
                              href={`/users/${user?.id}?name=${encodeURIComponent(user?.name || "익명")}`}
                              className={styles.dropdownItem}
                              onClick={() => setIsDropdownOpen(false)}
                          >
                            공개 프로필
                          </Link>
                        </div>
                    )}
                  </div>

                  <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
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