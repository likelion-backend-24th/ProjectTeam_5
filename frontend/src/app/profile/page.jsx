"use client";

import Header from "@/components/Header/Header";
import styles from "./page.module.css";
import { FaUserLarge } from "react-icons/fa6";
import { useAuth } from "@/app/contexts/AuthContext";

export default function ProfilePage() {
  const { user, userId, isLoggedIn, loading } = useAuth();

  if (loading) return <p></p>;
  if (!isLoggedIn) return <p>로그인이 필요합니다.</p>;

  return (
    <div>
      <main className={styles.page}>
        <div className={styles.contentGrid}>
          <section className={styles.profileCard}>
            <div className={styles.cardHeading}>
              <h1>내 프로필</h1>
            </div>

            <div className={styles.profileSummary}>
              <div className={styles.avatar} aria-hidden="true">
                <FaUserLarge />
              </div>
              <div>
                <p>{user.name}</p>
                <p>{user.email}</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
