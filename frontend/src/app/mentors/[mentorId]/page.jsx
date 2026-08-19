"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import styles from "./page.module.css";
import { uploadImage, validateImage } from "@/lib/attachments";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const MAX_BIO_LENGTH = 500;

export default function MentorProfilePage() {
  const params = useParams();
  const mentorId = params?.mentorId || params?.id;

  const { user: authUser, isLoggedIn } = useAuth();
  const currentUserId = authUser?.id || authUser?.userId;

  const [mentorInfo, setMentorInfo] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const [filter, setFilter] = useState("all");

  const [isOwner, setIsOwner] = useState(false);
  
  // 구독 상태 관리용 State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    company: "",
    career: "",
    tags: "",
    education: "",
    schedule: "",
    subscriptionPrice: 9900, // 💡 [추가] 구독 가격 상태값
  });

  const [isWritingPost, setIsWritingPost] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "" });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const contentRef = useRef(null);

  const insertCodeBlock = () => {
    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = postForm.content.slice(start, end);
    const snippet = "```java\n" + (selected || "여기에 코드") + "\n```\n";
    
    setPostForm((prev) => ({
      ...prev,
      content: prev.content.slice(0, start) + snippet + prev.content.slice(end),
    }));

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + "```java\n".length;
      el.setSelectionRange(pos, pos + (selected ? selected.length : 6));
    });
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    try {
      selected.forEach(validateImage);
      setFiles((prev) => [...prev, ...selected]);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!mentorId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") || localStorage.getItem("token")
            : null;

        const headers = {
          "Content-Type": "application/json",
          ...(currentUserId && { "X-USER-ID": String(currentUserId) }),
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const profileRes = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}`, {
          method: "GET",
          headers,
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setMentorInfo(profileData);
          
          setEditForm({
            bio: profileData.bio || "",
            company: profileData.company || "",
            career: profileData.career || "",
            tags: profileData.tags || "",
            education: profileData.education || "",
            schedule: profileData.schedule || "월 - 금 (10:00 - 17:00)",
            subscriptionPrice: profileData.subscriptionPrice || 9900, // 💡 [추가] 멘토가 설정한 구독 가격 초기화
          });

          if (isLoggedIn && authUser) {
            const targetMentorUserId = profileData.mentorId; 
            if (currentUserId && targetMentorUserId && String(targetMentorUserId) === String(currentUserId)) {
              setIsOwner(true);
            }
          }
        }

        const articlesRes = await fetch(`${BACKEND_URL}/api/v1/mentors/${mentorId}/posts`, {
          method: "GET",
          headers,
        });

        if (articlesRes.ok) {
          const articlesData = await articlesRes.json();
          setArticles(articlesData);
        }

        // 구독 정보 검증 로직
        if (isLoggedIn && currentUserId) {
          try {
            const checkRes = await fetch(`${BACKEND_URL}/api/v1/subscriptions/check?mentorId=${mentorId}`, {
              method: "GET",
              headers,
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              setIsSubscribed(checkData.isSubscribed);
            }

            const mySubsRes = await fetch(`${BACKEND_URL}/api/v1/subscriptions/me`, {
              method: "GET",
              headers,
            });
            if (mySubsRes.ok) {
              const mySubs = await mySubsRes.json();
              const currentSub = mySubs.find((sub) => String(sub.mentorId) === String(mentorId));
              if (currentSub) {
                setSubscriptionId(currentSub.subscriptionId);
                setIsSubscribed(true);
              }
            }
          } catch (subErr) {
            console.error("구독 정보 로드 실패:", subErr);
          }
        }
      } catch (error) {
        console.error("데이터 로드 중 네트워크 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mentorId, isLoggedIn, authUser, currentUserId]);

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요한 서비스입니다.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/v1/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-USER-ID": String(currentUserId),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ mentorId: Number(mentorId) }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(true);
        setSubscriptionId(data.subscriptionId);
        alert("멘토 구독이 완료되었습니다!");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "구독에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionId) {
      alert("구독 정보를 찾을 수 없습니다.");
      return;
    }

    if (!confirm("정말 구독을 해지하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/v1/subscriptions/${subscriptionId}/cancel`, {
        method: "PATCH",
        headers: {
          "X-USER-ID": String(currentUserId),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        setIsSubscribed(false);
        setSubscriptionId(null);
        alert("구독이 해지되었습니다.");
      } else {
        alert("구독 해지에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePostInputChange = (e) => {
    const { name, value } = e.target;
    setPostForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (editForm.bio.length > MAX_BIO_LENGTH) {
      alert(`소개글은 ${MAX_BIO_LENGTH}자 이내로 작성해주세요.`);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/mentors/${mentorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setMentorInfo((prev) => ({ ...prev, ...updatedData, ...editForm }));
        setIsEditing(false);
        alert("프로필이 성공적으로 수정되었습니다.");
      } else {
        alert("프로필 수정 실패");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title || !postForm.content) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      
      const uploaded = files.length > 0 ? await Promise.all(files.map((f) => uploadImage(f))) : [];
      const attachmentIds = uploaded.map((u) => u.attachId);

      const url = `${BACKEND_URL}/api/v1/mentors/${mentorId}/posts`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-USER-ID": currentUserId,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ ...postForm, attachmentIds }),
      });

      if (res.ok) {
        alert("게시글이 작성되었습니다.");
        
        const newPostData = await res.json().catch(() => null);
        if (newPostData && newPostData.id) {
          setArticles((prev) => [newPostData, ...prev]);
        } else {
          setTimeout(async () => {
            await fetchArticles();
          }, 200);
        }

        setPostForm({ title: "", content: "" });
        setFiles([]);
        setIsWritingPost(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.message || "요청 실패");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (!mentorInfo) return <div className={styles.error}>멘토 정보를 찾을 수 없습니다.</div>;

  const tagsArray = mentorInfo.tags ? mentorInfo.tags.split(",").map((t) => t.trim()) : [];
  
  // 미구독자 여부 판단 (소유자가 아니고, 구독하지 않은 경우)
  const showBlurOverlay = !isOwner && !isSubscribed;

  // 💡 [동적 가격 계산 헬퍼]
  const currentPrice = mentorInfo.subscriptionPrice ? Number(mentorInfo.subscriptionPrice).toLocaleString() : "9,900";

  return (
    <div className={styles.container}>
      {/* 1. 상단 멘토 프로필 배너 */}
      <section className={styles.profileBanner}>
        <div className={styles.heroLeft}>
          <img
            src={mentorInfo.profileImageUrl || "[https://via.placeholder.com/100](https://via.placeholder.com/100)"}
            alt={mentorInfo.name}
            className={styles.avatar}
          />
          <div className={styles.heroText}>
            <h1 className={styles.mentorName}>{mentorInfo.name}</h1>
            {isEditing ? (
              <div className={styles.editWrapper}>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  maxLength={MAX_BIO_LENGTH}
                  className={styles.editBioInput}
                  placeholder="소개글을 입력하세요"
                />
                <p className={styles.charCount}>{editForm.bio.length} / {MAX_BIO_LENGTH} 자</p>
              </div>
            ) : (
              <p className={styles.mentorBio}>{mentorInfo.bio || "소개글이 없습니다."}</p>
            )}

            <div className={styles.tagGroup}>
              {tagsArray.map((tag, i) => (
                <span key={i} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className={styles.statsRow}>
              <span>★ {mentorInfo.rating || "4.9"} ({mentorInfo.reviewCount || 0})</span>
              <span>👥 {mentorInfo.subscriberCount || 0} 구독자</span>
            </div>
          </div>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>게시글</span>
            <span className={styles.statValue}>{articles.length}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>리뷰</span>
            <span className={styles.statValue}>{mentorInfo.reviewCount || 0}</span>
          </div>
          <div className={styles.actionBtns}>
            {isOwner && (
              isEditing ? (
                <>
                  <button className={styles.saveBtn} onClick={handleSaveProfile}>저장</button>
                  <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>취소</button>
                </>
              ) : (
                <button className={styles.editBtn} onClick={() => setIsEditing(true)}>프로필 수정</button>
              )
            )}

            {!isOwner && (
              <>
                {isSubscribed ? (
                  <button className={styles.subBtn} onClick={handleCancelSubscription} style={{ backgroundColor: "#555", color: "#fff" }}>
                    ✓ 구독중
                  </button>
                ) : (
                  <button className={styles.subBtn} onClick={handleSubscribe} style={{ backgroundColor: "#000", color: "#fff" }}>
                    구독하기
                  </button>
                )}
                <button className={styles.consultBtn}>상담 신청</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. 탭 네비게이션 */}
      <div className={styles.tabNav}>
        <button className={activeTab === "feed" ? styles.activeTab : ""} onClick={() => setActiveTab("feed")}>피드</button>
        <button className={activeTab === "info" ? styles.activeTab : ""} onClick={() => setActiveTab("info")}>소개</button>
        <button className={activeTab === "review" ? styles.activeTab : ""} onClick={() => setActiveTab("review")}>리뷰</button>
      </div>

      {/* 3. 메인 2단 레이아웃 */}
      <div className={styles.mainGrid}>
        <div className={styles.feedColumn} style={{ position: "relative" }}>
          
          {isOwner && (
            <div style={{ marginBottom: "20px" }}>
              <button 
                className={styles.editBtn} 
                onClick={() => {
                  setPostForm({ title: "", content: "" });
                  setFiles([]);
                  setIsWritingPost(!isWritingPost);
                }}
              >
                {isWritingPost ? "작성 취소" : "✏️ 새 게시글 작성"}
              </button>
            </div>
          )}

          {isWritingPost && (
            <form onSubmit={handlePostSubmit} style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
              <h3>새 게시글 작성</h3>
              <div style={{ marginBottom: "10px" }}>
                <input
                  type="text"
                  name="title"
                  placeholder="제목을 입력하세요"
                  value={postForm.title}
                  onChange={handlePostInputChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <label htmlFor="content">내용 (마크다운)</label>
                  <button type="button" onClick={insertCodeBlock} style={{ padding: "2px 8px", cursor: "pointer" }}>
                    &lt;/&gt; 코드블록
                  </button>
                </div>
                <textarea
                  id="content"
                  ref={contentRef}
                  name="content"
                  placeholder="내용을 입력하세요"
                  value={postForm.content}
                  onChange={handlePostInputChange}
                  rows={5}
                  style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="images" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>파일 첨부 (이미지, 최대 5MB)</label>
                <input
                  id="images"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                {files.length > 0 && (
                  <ul style={{ display: "flex", gap: 8, flexWrap: "wrap", listStyle: "none", padding: 0, marginTop: "10px" }}>
                    {files.map((file, index) => (
                      <li key={index} style={{ position: "relative" }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          width={80}
                          height={80}
                          style={{ objectFit: "cover", borderRadius: 6 }}
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer" }}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {errorMessage && <p style={{ color: "red", marginBottom: "10px" }}>{errorMessage}</p>}

              <button type="submit" className={styles.saveBtn} disabled={submitting}>
                {submitting ? "처리 중..." : "작성 완료"}
              </button>
            </form>
          )}

          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <button className={filter === "all" ? styles.activeFilter : ""} onClick={() => setFilter("all")}>전체</button>
              <button className={filter === "popular" ? styles.activeFilter : ""} onClick={() => setFilter("popular")}>인기순</button>
              <button className={filter === "latest" ? styles.activeFilter : ""} onClick={() => setFilter("latest")}>최신순</button>
            </div>
            <input type="text" placeholder="게시글 검색" className={styles.searchInput} />
          </div>

          {/* 미구독자용 블러 및 오버레이 영역 */}
          <div style={{ position: "relative" }}>
            <div style={{ filter: showBlurOverlay ? "blur(6px)" : "none", pointerEvents: showBlurOverlay ? "none" : "auto", transition: "filter 0.3s" }}>
              <div className={styles.articleList}>
                {articles.length === 0 ? (
                  <div className={styles.empty}>등록된 게시글이 없습니다.</div>
                ) : (
                  articles.map((article) => (
                    <div key={article.id} className={styles.articleCardWrapper} style={{ position: "relative", marginBottom: "15px" }}>
                        <Link className={styles.articleCard} href={`/mentors/${mentorId}/posts/${article.id}`}>                        <div className={styles.articleBody}>
                          <div className={styles.badgeRow}>
                            <span className={styles.date}>
                              {article.createdAt ? article.createdAt.replace("T", " ").substring(0, 10) : ""}
                            </span>
                          </div>
                          <h3 className={styles.articleTitle}>{article.title}</h3>
                          <p className={styles.articleDesc}>{article.content}</p>
                        </div>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 미구독 안내 오버레이 박스 */}
            {showBlurOverlay && (
              <div style={{
                position: "absolute",
                top: "40px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "90%",
                maxWidth: "520px",
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                padding: "32px 24px",
                textAlign: "center",
                zIndex: 10
              }}>
                <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔒</div>
                <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px", color: "#111" }}>
                  이 멘토의 게시글은 구독자에게만 공개됩니다
                </h3>
                <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
                  실무에서 바로 적용 가능한 인사이트와 노하우를<br />지금 구독하고 모두 확인해보세요.
                </p>

                <div style={{ background: "#f8f9fa", borderRadius: "12px", padding: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-around" }}>
                  <div>
                    <div style={{ fontSize: "16px", marginBottom: "4px" }}>📄</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#333" }}>전체 게시글 열람</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", marginBottom: "4px" }}>💡</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#333" }}>실무 노하우</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", marginBottom: "4px" }}>💬</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#333" }}>댓글 참여</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "16px", marginBottom: "4px" }}>📥</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#333" }}>자료 다운로드</div>
                  </div>
                </div>

                {/* 💡 [수정] 동적 구독 금액 반영 */}
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111", marginBottom: "16px" }}>
                  월 {currentPrice}원 구독
                </div>

                <button 
                  onClick={handleSubscribe}
                  style={{
                    width: "100%",
                    background: "#0051ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "14px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginBottom: "12px"
                  }}
                >
                  월 {currentPrice}원으로 구독하기
                </button>
                <p style={{ fontSize: "12px", color: "#888" }}>언제든지 해지할 수 있어요. • 첫 구독 시 7일 무료 체험</p>
              </div>
            )}
          </div>
        </div>

      {/* 우측 사이드바 */}
        <aside className={styles.sidebar}>
          
          {/* 구독 혜택 카드 */}
          {!isOwner && !isSubscribed && (
            <div className={styles.sidebarCard} style={{ border: "1px solid #e1e7ec", background: "#fff" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px" }}>구독 혜택</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                  <span style={{ color: "#0051ff", fontWeight: "bold" }}>✓</span>
                  <div>
                    <strong style={{ display: "block", color: "#111" }}>전체 피드 열람</strong>
                    <span style={{ color: "#666", fontSize: "12px" }}>모든 게시글 무제한 열람</span>
                  </div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                  <span style={{ color: "#0051ff", fontWeight: "bold" }}>✓</span>
                  <div>
                    <strong style={{ display: "block", color: "#111" }}>구독자 전용 콘텐츠</strong>
                    <span style={{ color: "#666", fontSize: "12px" }}>실무 노하우와 심층 인사이트</span>
                  </div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                  <span style={{ color: "#0051ff", fontWeight: "bold" }}>✓</span>
                  <div>
                    <strong style={{ display: "block", color: "#111" }}>자료 다운로드</strong>
                    <span style={{ color: "#666", fontSize: "12px" }}>템플릿, 체크리스트, 가이드 제공</span>
                  </div>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px" }}>
                  <span style={{ color: "#0051ff", fontWeight: "bold" }}>✓</span>
                  <div>
                    <strong style={{ display: "block", color: "#111" }}>댓글 참여 및 질문</strong>
                    <span style={{ color: "#666", fontSize: "12px" }}>멘토에게 직접 질문하고 답변 받기</span>
                  </div>
                </li>
              </ul>

              <div style={{ borderTop: "1px solid #eee", paddingTop: "16px" }}>
                {/* 💡 [수정] 동적 구독 금액 반영 */}
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#111", marginBottom: "12px" }}>
                  월 {currentPrice}원
                </div>
                <button 
                  onClick={handleSubscribe}
                  style={{
                    width: "100%",
                    background: "#0051ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    marginBottom: "8px"
                  }}
                >
                  구독하고 전체 보기
                </button>
                <p style={{ fontSize: "11px", color: "#888", textAlign: "center" }}>첫 구독 시 7일 무료 체험</p>
              </div>
            </div>
          )}

          <div className={styles.sidebarCard}>
            <h3>멘토 정보</h3>
            <ul className={styles.infoList}>
              <li>
                <strong>현직</strong>
                {isEditing ? (
                  <input type="text" name="company" value={editForm.company} onChange={handleInputChange} className={styles.editInput} />
                ) : (
                  <span>{mentorInfo.company || "Senior Designer @ 네이버"}</span>
                )}
              </li>
              <li>
                <strong>경력</strong>
                {isEditing ? (
                  <input type="text" name="career" value={editForm.career} onChange={handleInputChange} className={styles.editInput} />
                ) : (
                  <span>{mentorInfo.career || "9년"}</span>
                )}
              </li>
              <li>
                <strong>전문 분야</strong>
                {isEditing ? (
                  <input type="text" name="tags" value={editForm.tags} onChange={handleInputChange} className={styles.editInput} placeholder="쉼표(,)로 구분" />
                ) : (
                  <span>{mentorInfo.tags || "UI/UX, 프로토타이핑"}</span>
                )}
              </li>
              <li>
                <strong>학력</strong>
                {isEditing ? (
                  <input type="text" name="education" value={editForm.education} onChange={handleInputChange} className={styles.editInput} />
                ) : (
                  <span>{mentorInfo.education || "홍익대학교 디자인과"}</span>
                )}
              </li>

              {/* 💡 [추가] 멘토 본인일 때 수정 모드에서 구독 가격 입력 가능 */}
              {isEditing && (
                <li>
                  <strong>구독 월 이용료</strong>
                  <input 
                    type="number" 
                    name="subscriptionPrice" 
                    value={editForm.subscriptionPrice} 
                    onChange={handleInputChange} 
                    className={styles.editInput} 
                    step="1000"
                    min="0"
                  />
                </li>
              )}
            </ul>
          </div>

          <div className={styles.sidebarCard}>
            <h3>상담 가능 시간</h3>
            {isEditing ? (
              <textarea name="schedule" value={editForm.schedule} onChange={handleInputChange} className={styles.editBioInput} />
            ) : (
              <ul className={styles.scheduleList}>
                <li>
                  <span>{mentorInfo.schedule || "월 - 금 (10:00 - 17:00)"}</span>
                </li>
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}