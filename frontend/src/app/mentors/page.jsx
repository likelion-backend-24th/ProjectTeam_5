"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMentorArticles } from "@/lib/mentorArticles";
import { getMe } from "@/lib/auth";
import styles from "./page.module.css";

export default function MentorArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("accessToken") : null;
      try {
        const [articlesData, userData] = await Promise.all([
          getMentorArticles(),
          token ? getMe(token).catch(() => null) : Promise.resolve(null),
        ]);
        setArticles(articlesData.content ?? articlesData ?? []);
        setCurrentUser(userData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isMentor = currentUser?.role === "MENTOR" || currentUser?.isMentor === true;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>멘토 인사이트</h1>
          <p>현직 멘토들의 경험과 커리어 노하우를 확인해보세요.</p>
        </div>
        {isMentor && (
          <Link href="/mentor-articles/write" className={styles.writeBtn}>
            칼럼 작성하기
          </Link>
        )}
      </header>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <div className={styles.grid}>
          {articles.map((article) => (
            <Link key={article.id} href={`/mentor-articles/${article.id}`} className={styles.card}>
              <span className={styles.category}>{article.category || "인사이트"}</span>
              <h2>{article.title}</h2>
              <p className={styles.summary}>{article.summary || article.content?.slice(0, 100)}</p>
              <div className={styles.authorInfo}>
                <span>{article.authorName} 멘토</span>
                <span className={styles.date}>{article.createdAt?.slice(0, 10)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}