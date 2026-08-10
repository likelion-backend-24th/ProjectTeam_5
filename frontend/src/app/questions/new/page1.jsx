"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createQuestion } from "@/lib/questions"; 

import styles from "./page.module.css";

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 5000;

export default function QuestionWritePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "PDF, PNG, JPG 형식의 파일만 첨부할 수 있습니다."
      );

      event.target.value = "";
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setErrorMessage("첨부 파일은 10MB 이하만 가능합니다.");

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      setErrorMessage("질문 제목을 입력해주세요.");
      return;
    }

    if (!content) {
      setErrorMessage("질문 내용을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const requestData = new FormData();

      requestData.append("title", title);
      requestData.append("content", content);

      if (selectedFile) {
        requestData.append("file", selectedFile);
      }

    //   console.log("질문 등록 데이터:", {
    //     title,
    //     content,
    //     file: selectedFile,
    //   });

    //   console.log([...requestData.entries()]);

      await createQuestion({ title, content });

      router.push("/questions");
    } catch (error) {
      console.error("질문 등록 실패:", error);

      setErrorMessage(
        error.message || "질문 등록 중 문제가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <h1 className={styles.title}>
          새 질문 작성
        </h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="title">질문 제목</label>
            </div>

            <div className={styles.inputWrapper}>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                maxLength={TITLE_MAX_LENGTH}
                placeholder="질문 제목을 입력해주세요"
                required
              />

              <span className={styles.characterCount}>
                {form.title.length}/{TITLE_MAX_LENGTH}
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="content">질문 내용</label>
            </div>

            <div className={styles.textareaWrapper}>
              <textarea
                id="content"
                name="content"
                value={form.content}
                onChange={handleChange}
                maxLength={CONTENT_MAX_LENGTH}
                placeholder="질문의 내용을 자세히 작성해주세요."
                required
              />

              <span className={styles.textareaCount}>
                {form.content.length}/{CONTENT_MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* <div className={styles.fileSection}>
            <span className={styles.fileLabel}>파일 첨부</span>

            <div className={styles.fileControls}>
              <label
                htmlFor="questionFile"
                className={styles.fileButton}
              >
                [파일 선택]
              </label>

              <input
                ref={fileInputRef}
                id="questionFile"
                name="file"
                type="file"
                className={styles.hiddenFileInput}
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />

              {selectedFile && (
                <div className={styles.selectedFile}>
                  <span>{selectedFile.name}</span>
                  <span className={styles.fileCheck}>✓</span>

                  <button
                    type="button"
                    className={styles.removeFileButton}
                    onClick={handleRemoveFile}
                    aria-label="첨부 파일 제거"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            <p className={styles.fileDescription}>
              PDF, PNG, JPG 파일을 최대 10MB까지 첨부할 수
              있습니다.
            </p>
          </div> */}

          <div className={styles.policyNotice}>
            <span aria-hidden="true">📌</span>

            <p>
              <strong>정책 안내:</strong> 본인의 글만 영구 수정
              가능하며, 부적절한 성격의 도배글 등은
              관리자(ADMIN) 권한에 의해 사전 통보 없이 삭제만
              처리될 수 있습니다.
            </p>
          </div>

          {errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}

          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </button>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "처리 중..."
                : "질문 등록 / 수정 완료"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}