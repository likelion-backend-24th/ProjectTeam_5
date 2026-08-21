"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { getMyChatRooms, sendChatMessage, getChatMessages } from "@/lib/chat";
import styles from "./page.module.css";

// WebSocket 없이 폴링(3초 간격)으로 새 메시지를 확인한다. 실시간 알림(F-38)이 붙기 전까지의 임시 방식.
const POLL_INTERVAL_MS = 3000;

const formatMessageTime = (isoString) =>
  new Date(isoString).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true });

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const { isLoggedIn, loading: authLoading, userId } = useAuth();
  const router = useRouter();

  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const pollingRef = useRef(null);
  const messageListRef = useRef(null);
  const messageInputRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const page = await getChatMessages(roomId);
      // 백엔드는 최신순(desc)으로 내려주므로, 화면에서는 오래된 순으로 뒤집는다.
      setMessages((page?.content ?? []).slice().reverse());
    } catch (err) {
      setError(err.message);
    }
  }, [roomId]);

  const loadRoomInfo = useCallback(async () => {
    try {
      const rooms = await getMyChatRooms();
      const found = rooms.find((r) => String(r.chatRoomId) === String(roomId));
      if (!found) {
        setError("채팅방을 찾을 수 없습니다.");
        return;
      }
      setRoomInfo(found);
    } catch (err) {
      setError(err.message);
    }
  }, [roomId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    (async () => {
      setLoading(true);
      await Promise.all([loadRoomInfo(), loadMessages()]);
      setLoading(false);
    })();

    pollingRef.current = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(pollingRef.current);
  }, [authLoading, isLoggedIn, router, loadRoomInfo, loadMessages]);

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight });
  }, [messages]);

  // 전송 직후(입력창이 disabled에서 풀리는 시점) 커서를 다시 입력창에 두어, 엔터로 연속 전송할 수 있게 한다.
  useEffect(() => {
    if (!sending) {
      messageInputRef.current?.focus();
    }
  }, [sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = messageInput.trim();
    if (!content || sending) return;

    try {
      setSending(true);
      setMessageInput("");
      await sendChatMessage(roomId, content);
      await loadMessages();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return <p className={styles.status}>불러오는 중...</p>;
  }

  const isMine = roomInfo && String(userId) === String(roomInfo.mentorId);
  const counterpartName = roomInfo ? (isMine ? roomInfo.subscriberName : roomInfo.mentorName) : "";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/chat" className={styles.backLink} aria-label="목록으로">
          ←
        </Link>
        <h1 className={styles.counterpartName}>{counterpartName || "채팅"}</h1>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.messageList} ref={messageListRef}>
        {messages.map((msg) => {
          const mine = String(msg.senderId) === String(userId);
          return (
            <li
              key={msg.messageId}
              className={mine ? styles.myMessageRow : styles.otherMessageRow}
            >
              {mine && <span className={styles.messageTime}>{formatMessageTime(msg.createdAt)}</span>}
              <div className={mine ? styles.myBubble : styles.otherBubble}>
                {msg.content}
              </div>
              {!mine && <span className={styles.messageTime}>{formatMessageTime(msg.createdAt)}</span>}
            </li>
          );
        })}
      </ul>

      <form className={styles.sendForm} onSubmit={handleSend}>
        <input
          ref={messageInputRef}
          type="text"
          className={styles.sendInput}
          placeholder="메시지를 입력하세요"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className={styles.sendButton} disabled={sending || !messageInput.trim()}>
          전송
        </button>
      </form>
    </main>
  );
}
