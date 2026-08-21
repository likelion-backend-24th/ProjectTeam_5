"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./NotificationBell.module.css";
import {
  deleteNotification,
  deleteReadNotifications,
  getMyNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";

const POLL_INTERVAL_MS = 15000;

const formatNotificationTime = (isoString) =>
  new Date(isoString).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true });

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const loadUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data?.unreadCount ?? 0);
    } catch {
      // 알림 개수 조회 실패는 조용히 무시 (뱃지만 안 뜨는 정도)
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setLoading(true);
      try {
        const page = await getMyNotifications();
        setNotifications(page?.content ?? []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.notificationId);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
          )
        );
      } catch {
        // 읽음 처리 실패해도 이동은 진행
      }
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleDelete = async (event, notification) => {
    event.stopPropagation();
    try {
      await deleteNotification(notification.notificationId);
      setNotifications((prev) => prev.filter((n) => n.notificationId !== notification.notificationId));
      if (!notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // 삭제 실패 시 목록은 그대로 둔다
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // 무시
    }
  };

  const handleDeleteRead = async () => {
    try {
      await deleteReadNotifications();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch {
      // 무시
    }
  };

  const hasRead = notifications.some((n) => n.isRead);

  return (
    <div className={styles.container} ref={containerRef}>
      <button type="button" className={styles.bellButton} onClick={handleToggle} aria-label="알림">
        🔔
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span>알림</span>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button type="button" className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                  모두 읽음
                </button>
              )}
              {hasRead && (
                <button type="button" className={styles.markAllBtn} onClick={handleDeleteRead}>
                  읽은 알림 삭제
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <p className={styles.status}>불러오는 중...</p>
          ) : notifications.length === 0 ? (
            <p className={styles.status}>알림이 없습니다.</p>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n) => (
                <li key={n.notificationId} className={n.isRead ? styles.item : styles.itemUnread}>
                  <button type="button" className={styles.itemMain} onClick={() => handleNotificationClick(n)}>
                    <span className={styles.itemMessage}>{n.message}</span>
                    <span className={styles.itemTime}>{formatNotificationTime(n.createdAt)}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, n)}
                    aria-label="알림 삭제"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
