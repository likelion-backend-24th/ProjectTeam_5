"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { getMyChatRooms } from "@/lib/chat";
import styles from "./page.module.css";

export default function ChatRoomListPage() {
  const { isLoggedIn, loading: authLoading, userId } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyChatRooms();
      setRooms(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    loadRooms();
  }, [authLoading, isLoggedIn, router, loadRooms]);

  if (authLoading || loading) {
    return <p className={styles.status}>불러오는 중...</p>;
  }

  return (
    <main className={`${styles.page} container`}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>내 상담 채팅</h1>
        <p className={styles.pageDescription}>
          구독 중인 멘토, 또는 나를 구독한 멘티와의 1:1 상담 목록입니다.
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {rooms.length === 0 ? (
        <div className={styles.empty}>
          아직 시작된 상담이 없습니다. 멘토 프로필에서 "상담 신청"으로 대화를 시작해보세요.
        </div>
      ) : (
        <ul className={styles.roomList}>
          {rooms.map((room) => {
            const isMine = String(userId) === String(room.mentorId);
            const counterpartName = isMine ? room.subscriberName : room.mentorName;
            const roleLabel = isMine ? "멘티" : "멘토";

            return (
              <li key={room.chatRoomId}>
                <button
                  type="button"
                  className={styles.roomCard}
                  onClick={() => router.push(`/chat/${room.chatRoomId}`)}
                >
                  <div className={styles.avatar}>{counterpartName?.[0] ?? "?"}</div>
                  <div className={styles.roomInfo}>
                    <span className={styles.roomName}>{counterpartName}</span>
                    <span className={styles.roomRole}>{roleLabel}</span>
                  </div>
                  <span className={styles.chevron}>›</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
