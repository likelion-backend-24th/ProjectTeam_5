"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUsers } from "@/lib/users";
import styles from "@/app/questions/page.module.css";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        getUsers()
            .then((data) => setUsers(data || []))
            .catch((err) => setErrorMessage(err.message || "유저 목록을 불러오지 못했습니다."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className={styles.page}>
            <div className={styles.heading}>
                <div>
                    <h1>가입 유저 목록</h1>
                    <p>MentorBridge를 이용 중인 유저들을 확인하고 작성한 글을 살펴보세요.</p>
                </div>
            </div>

            <section className={styles.panel}>
                {loading && <p className={styles.statusText}>불러오는 중...</p>}
                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

                {!loading && !errorMessage && users.length === 0 && (
                    <p className={styles.statusText}>등록된 유저가 없습니다.</p>
                )}

                {!loading && !errorMessage && users.length > 0 && (
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th style={{ width: "60px", textAlign: "center" }}>ID</th>
                            <th style={{ width: "200px" }}>이름</th>
                            <th style={{ width: "120px" }}>역할</th>
                            <th style={{ width: "200px" }}>관심 분야</th>
                            <th style={{ width: "120px", textAlign: "center" }}>작성글 보기</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td style={{ textAlign: "center" }}>{u.id}</td>
                                <td>
                                    <Link href={`/users/${u.id}?name=${encodeURIComponent(u.name)}`} style={{ fontWeight: "bold", color: "#2867e8" }}>
                                        {u.name}
                                    </Link>
                                </td>
                                <td>{u.role}</td>
                                <td>{u.interests || "-"}</td>
                                <td style={{ textAlign: "center" }}>
                                    <Link href={`/users/${u.id}?name=${encodeURIComponent(u.name)}`} className={styles.askButton} style={{ padding: "6px 12px", fontSize: "12px", display: "inline-block" }}>
                                        게시글 보기
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}