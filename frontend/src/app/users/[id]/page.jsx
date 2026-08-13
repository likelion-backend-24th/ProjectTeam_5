"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getQuestionsByUser } from "@/lib/users";
import styles from "@/app/questions/page.module.css";

export default function UserQuestionsPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const queryName = searchParams.get("name");

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        getQuestionsByUser(id)
            .then((res) => setData(res))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const questions = data?.content || [];
    const userName = queryName || questions[0]?.authorName || `유저 #${id}`;

    return (
        <main className={styles.page}>
            <Link href="/users" style={{ display: "inline-block", marginBottom: "16px", color: "#2867e8", fontSize: "14px" }}>
                ← 유저 목록으로 돌아가기
            </Link>

            <div className={styles.heading}>
                <div>
                    <h1>{userName} 님의 작성글</h1>
                    <p>해당 유저가 커뮤니티에 작성한 질문 목록입니다.</p>
                </div>
            </div>

            <section className={styles.panel}>
                {loading ? (
                    <p className={styles.statusText}>불러오는 중...</p>
                ) : questions.length === 0 ? (
                    <p className={styles.statusText}>작성한 질문이 없습니다.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th style={{ width: "70px", textAlign: "center" }}>분류</th>
                            <th style={{ width: "auto" }}>질문 제목</th>
                            <th style={{ width: "70px", textAlign: "center" }}>답변수</th>
                            <th style={{ width: "80px", textAlign: "center" }}>좋아요</th>
                            <th style={{ width: "100px", textAlign: "center" }}>등록일</th>
                        </tr>
                        </thead>
                        <tbody>
                        {questions.map((q) => (
                            <tr key={q.id}>
                                <td style={{ textAlign: "center" }}>
                    <span style={{ color: "#2867e8", fontSize: "13px", fontWeight: "bold" }}>
                      [{q.category || "기타"}]
                    </span>
                                </td>
                                <td className={styles.titleCell}>
                                    <Link href={`/questions/${q.id}`}>{q.title}</Link>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                    <span className={styles.answerCount}>{q.answerCount ?? 0}개</span>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                    <span className={styles.likeCountBadge}>❤️ {q.likeCount ?? 0}</span>
                                </td>
                                <td style={{ textAlign: "center" }}>{q.createdAt?.slice(0, 10)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}