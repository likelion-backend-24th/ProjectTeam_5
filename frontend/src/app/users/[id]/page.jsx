"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
// 👇 getAnsweredQuestionsByUser, toggleFollowUser 함수 임포트
import { getQuestionsByUser, getPublicProfile, updatePublicProfileData, updateProfileImageUrl, getToken, getAnsweredQuestionsByUser, toggleFollowUser } from "@/lib/users";
import { uploadProfileImage } from "@/lib/attachments";
import styles from "./page.module.css";

export default function PublicProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [questions, setQuestions] = useState([]);

    // 👇 답변한 질문 데이터를 담을 상태 추가
    const [answeredQuestions, setAnsweredQuestions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("소개");

    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editForm, setEditForm] = useState({
        bio: "", careers: "", description: "", location: "", tags: "",
    });

    const fileInputRef = useRef(null);
    const [newImageFile, setNewImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const isMyProfile = currentUser && String(currentUser.id) === String(id);

    const handleFollow = async () => {
        const token = getToken();
        if (!token) return alert("로그인이 필요합니다.");

        try {
            await toggleFollowUser(id, token);
            setProfile((prev) => ({
                ...prev,
                isFollowing: !prev.isFollowing,
                followerCount: prev.isFollowing ? prev.followerCount - 1 : prev.followerCount + 1,
            }));
        } catch (e) {
            alert(e.message);
        }
    };

    useEffect(() => {
        if (!id) return;

        // 👇 Promise.all에 답변한 질문 API 추가
        Promise.all([
            getPublicProfile(id),
            getQuestionsByUser(id),
            getAnsweredQuestionsByUser(id)
        ])
            .then(([profData, qData, aqData]) => {
                setProfile(profData);
                setQuestions(qData?.content || []);
                setAnsweredQuestions(aqData?.content || []); // 👈 데이터 세팅
                setEditForm({
                    bio: profData.bio || "",
                    careers: profData.careers || "",
                    description: profData.description || "",
                    location: profData.location || "",
                    tags: profData.tags || "",
                });
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleEditClick = () => setIsEditing(true);

    const handleCancelEdit = () => {
        setIsEditing(false);
        setNewImageFile(null);
        setImagePreview(null);
        setEditForm({
            bio: profile.bio || "", careers: profile.careers || "", description: profile.description || "", location: profile.location || "", tags: profile.tags || "",
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setNewImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        const token = getToken();
        if (!token) return alert("로그인이 필요합니다.");

        setIsSubmitting(true);
        try {
            let finalImageUrl = profile.profileImageUrl;
            if (newImageFile) {
                finalImageUrl = await uploadProfileImage(newImageFile);
                await updateProfileImageUrl(finalImageUrl, token);
            }

            await updatePublicProfileData(editForm, token);

            setProfile((prev) => ({
                ...prev, ...editForm, profileImageUrl: finalImageUrl,
            }));
            setIsEditing(false);
            alert("프로필이 성공적으로 수정되었습니다.");
        } catch (error) {
            alert(error.message || "프로필 수정에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <main className={styles.page}><div className={styles.emptyState}>불러오는 중...</div></main>;
    if (!profile) return <main className={styles.page}><div className={styles.emptyState}>유저를 찾을 수 없습니다.</div></main>;

    const avatarUrl = imagePreview || profile.profileImageUrl || `https://ui-avatars.com/api/?name=${profile.name || "익명"}&background=f1f5f9&color=64748b&size=150`;
    const tagsArray = profile.tags ? profile.tags.split(/[\s,]+/).filter(t => t.trim()) : [];

    return (
        <main className={styles.page}>
            <div className={styles.topNav}>
                <button className={styles.backButton} onClick={() => router.push('/questions')}>
                    ← 질문 피드로 돌아가기
                </button>
                <div className={styles.navRight}>
                    <span className={styles.publicBadge}>🌐 공개 프로필</span>
                    {isMyProfile && !isEditing && (
                        <button className={styles.editButton} onClick={handleEditClick}>✏️ 프로필 수정</button>
                    )}
                </div>
            </div>

            <section className={styles.profileCard}>
                <div className={styles.profileLeft}>
                    <div className={styles.avatarWrapper} onClick={() => isEditing && fileInputRef.current?.click()}>
                        <img src={avatarUrl} alt="프로필" className={styles.avatar} />
                        {isEditing && (
                            <div className={styles.avatarOverlay}>
                                <span>📷 변경</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" hidden />
                    </div>

                    <div className={styles.info}>
                        <h1>
                            {profile.name}
                            <span className={profile.role === "MENTOR" ? styles.mentorBadge : styles.userBadge}>
                                {profile.role === "MENTOR" ? "멘토" : "일반 회원"}
                            </span>
                        </h1>
                        <span className={styles.handle}>@user_{profile.id}</span>

                        {isEditing ? (
                            <input
                                className={styles.editInput}
                                value={editForm.bio}
                                onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                placeholder="한 줄 소개를 입력해주세요."
                            />
                        ) : (
                            <p className={styles.bio}>
                                {profile.bio ? profile.bio.split('\n').map((line, idx) => <span key={idx}>{line}<br/></span>) : "등록된 소개가 없습니다."}
                            </p>
                        )}

                        {/* 👇 내 프로필이 아닐 때 팔로우, 메시지 버튼 노출 👇 */}
                        {!isEditing && !isMyProfile && (
                            <div className={styles.actionButtons}>
                                <button
                                    className={profile.isFollowing ? styles.followingBtn : styles.followBtn}
                                    onClick={handleFollow}
                                >
                                    {profile.isFollowing ? "✓ 팔로잉" : "+ 팔로우"}
                                </button>
                                <button className={styles.messageBtn} onClick={() => alert("준비 중인 기능입니다.")}>
                                    💬 메시지
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.profileRight}>
                    {/* 👇 팔로워, 팔로잉 통계 추가 👇 */}
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>팔로워</span>
                        <span className={styles.statValueActive}>{profile.followerCount || 0}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>팔로잉</span>
                        <span className={styles.statValue}>{profile.followingCount || 0}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>작성 질문</span>
                        <span className={styles.statValue}>{questions.length}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>작성 답변</span>
                        <span className={styles.statValue}>{answeredQuestions.length}</span>
                    </div>
                </div>
            </section>

            <nav className={styles.tabs}>
                {["소개", "작성한 질문", "작성한 답변"].map((tab) => (
                    <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`} onClick={() => setActiveTab(tab)}>
                        {tab}
                    </button>
                ))}
            </nav>

            <div className={styles.contentLayout}>
                <div className={styles.feedColumn}>
                    {activeTab === "작성한 질문" && (
                        <>
                            <div className={styles.feedHeader}>
                                <span>총 {questions.length}개의 질문</span>
                            </div>
                            {questions.length > 0 ? (
                                questions.map((q) => (
                                    <Link href={`/questions/${q.id}`} key={q.id} className={styles.questionCard}>
                                        <span className={styles.qCategory}>{q.category || "기타"}</span>
                                        <h3 className={styles.qTitle}>{q.title}</h3>
                                        <div className={styles.qMeta}>
                                            <span>{q.createdAt?.slice(0, 10).replace(/-/g, ".")}</span>
                                            <span>·</span>
                                            <span>💬 {q.answerCount ?? 0}개 답변</span>
                                            <span>·</span>
                                            <span>❤️ {q.likeCount ?? 0}</span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className={styles.emptyState}>작성한 질문이 없습니다.</div>
                            )}
                        </>
                    )}

                    {activeTab === "작성한 답변" && (
                        <>
                            <div className={styles.feedHeader}>
                                <span>총 {answeredQuestions.length}개의 질문에 답변했습니다.</span>
                            </div>
                            {answeredQuestions.length > 0 ? (
                                answeredQuestions.map((q) => (
                                    <Link href={`/questions/${q.id}`} key={q.id} className={styles.questionCard}>
                                        <span className={styles.qCategory}>{q.category || "기타"}</span>
                                        <h3 className={styles.qTitle}>{q.title}</h3>
                                        <div className={styles.qMeta}>
                                            <span>{q.createdAt?.slice(0, 10).replace(/-/g, ".")}</span>
                                            <span>·</span>
                                            <span>💬 {q.answerCount ?? 0}개 답변</span>
                                            <span>·</span>
                                            <span>❤️ {q.likeCount ?? 0}</span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className={styles.emptyState}>작성한 답변이 없습니다.</div>
                            )}
                        </>
                    )}

                    {activeTab === "소개" && (
                        <div className={styles.introContent}>
                            <h3>💡 상세 소개</h3>
                            {isEditing ? (
                                <textarea
                                    className={styles.editTextarea}
                                    value={editForm.description}
                                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                                    placeholder="자세한 소개를 작성해주세요."
                                    rows={5}
                                />
                            ) : (
                                <p className={styles.bio}>{profile.description || "등록된 상세 소개가 없습니다."}</p>
                            )}
                        </div>
                    )}
                </div>

                <aside className={styles.sidebar}>
                    <h3>👤 경력 / 이력</h3>
                    {isEditing ? (
                        <textarea
                            className={styles.editTextarea}
                            value={editForm.careers}
                            onChange={e => setEditForm({...editForm, careers: e.target.value})}
                            placeholder="경력을 입력해주세요. (엔터로 구분)"
                            rows={3}
                        />
                    ) : (
                        <p>
                            {profile.careers ? profile.careers.split('\n').map((line, idx) => <span key={idx}>{line}<br /></span>) : "-"}
                        </p>
                    )}

                    <div className={styles.locationTitle} style={{marginTop: '24px'}}>🏷️ 해시태그 (띄어쓰기로 구분)</div>
                    {isEditing ? (
                        <input
                            className={styles.editInput}
                            value={editForm.tags}
                            onChange={e => setEditForm({...editForm, tags: e.target.value})}
                            placeholder="예: #백엔드 #Java"
                        />
                    ) : (
                        <div className={styles.tags} style={{marginTop: '8px'}}>
                            {tagsArray.length > 0 ? tagsArray.map((tag, idx) => (
                                <span key={idx} className={styles.tag}>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                            )) : <span className={styles.location}>등록된 태그 없음</span>}
                        </div>
                    )}

                    <div className={styles.locationTitle} style={{marginTop: '24px'}}>📍 활동 지역</div>
                    {isEditing ? (
                        <input
                            className={styles.editInput}
                            value={editForm.location}
                            onChange={e => setEditForm({...editForm, location: e.target.value})}
                            placeholder="예: 서울, 경기"
                        />
                    ) : (
                        <div className={styles.location}>{profile.location || "-"}</div>
                    )}

                    {isEditing && (
                        <div className={styles.editActions}>
                            <button className={styles.cancelBtn} onClick={handleCancelEdit} disabled={isSubmitting}>취소</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting ? "저장 중..." : "저장하기"}
                            </button>
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}